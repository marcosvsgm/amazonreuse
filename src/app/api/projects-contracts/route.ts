import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { canAccessTenant, getSession } from '@/lib/auth';

const input = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(2).max(160),
  type: z.enum(['PROJECT', 'CONTRACT']),
  responsible: z.string().min(2).max(120),
  status: z.enum(['ACTIVE', 'PAUSED', 'FINISHED']),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().nullable().optional(),
  modules: z.string().max(4000).optional(),
});

function canManage(role: string) {
  return ['SUPER_ADMIN', 'CONSULTANT', 'TECHNICAL_MANAGER', 'CLIENT_ADMIN'].includes(role);
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const tenantId = params.get('tenantId') || session.tenantId;
  if (tenantId && !canAccessTenant(session, tenantId)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  if (!tenantId && session.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const query = params.get('q')?.trim();
  const status = params.get('status');
  const db = getDb();
  const records = await db.contract.findMany({
    where: {
      ...(tenantId ? { tenantId } : {}),
      ...(status && ['ACTIVE', 'PAUSED', 'FINISHED'].includes(status) ? { status: status as 'ACTIVE' | 'PAUSED' | 'FINISHED' } : {}),
      ...(query ? { name: { contains: query } } : {}),
    },
    include: { tenant: { select: { name: true } }, documents: { select: { id: true, title: true, type: true, createdAt: true } } },
    orderBy: { endsAt: 'asc' },
  });
  return NextResponse.json(records);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (!canManage(session.role)) return NextResponse.json({ error: 'Você não tem permissão para cadastrar registros.' }, { status: 403 });
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 });
  if (!canAccessTenant(session, parsed.data.tenantId)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const db = getDb();
  const record = await db.contract.create({
    data: { ...parsed.data, startsAt: new Date(parsed.data.startsAt), endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null, modules: parsed.data.modules || '[]' },
    include: { tenant: { select: { name: true } }, documents: true },
  });
  await db.auditLog.create({ data: { tenantId: record.tenantId, actorId: session.userId, action: 'CREATE', entity: 'Contract', entityId: record.id, metadata: { type: record.type } } });
  return NextResponse.json(record, { status: 201 });
}
