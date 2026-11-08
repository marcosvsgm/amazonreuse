import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { canAccessTenant, getSession } from '@/lib/auth';

const input = z.object({ title: z.string().min(1).max(180), type: z.string().min(1).max(80), storageKey: z.string().min(1).max(4000) });
const canManage = (role: string) => ['SUPER_ADMIN', 'CONSULTANT', 'TECHNICAL_MANAGER', 'CLIENT_ADMIN'].includes(role);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !canManage(session.role)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  const db = getDb();
  const record = await db.contract.findUnique({ where: { id: (await params).id } });
  if (!record || !canAccessTenant(session, record.tenantId)) return NextResponse.json({ error: 'Registro não encontrado.' }, { status: 404 });
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Informe os dados do documento.' }, { status: 400 });
  const document = await db.document.create({ data: { tenantId: record.tenantId, contractId: record.id, ...parsed.data, status: 'ATTACHED' } });
  await db.auditLog.create({ data: { tenantId: record.tenantId, actorId: session.userId, action: 'ATTACH', entity: 'Document', entityId: document.id, metadata: { contractId: record.id } } });
  return NextResponse.json(document, { status: 201 });
}
