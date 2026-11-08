import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { canAccessTenant, getSession } from '@/lib/auth';

const input = z.object({ name: z.string().min(2).max(160), type: z.enum(['PROJECT', 'CONTRACT']), responsible: z.string().min(2).max(120), status: z.enum(['ACTIVE', 'PAUSED', 'FINISHED']), startsAt: z.string().datetime(), endsAt: z.string().datetime().nullable().optional(), modules: z.string().max(4000).optional() });
const canManage = (role: string) => ['SUPER_ADMIN', 'CONSULTANT', 'TECHNICAL_MANAGER', 'CLIENT_ADMIN'].includes(role);

async function ownedRecord(id: string) {
  return getDb().contract.findUnique({ where: { id } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !canManage(session.role)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  const record = await ownedRecord((await params).id);
  if (!record || !canAccessTenant(session, record.tenantId)) return NextResponse.json({ error: 'Registro não encontrado.' }, { status: 404 });
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 });
  const db = getDb();
  const updated = await db.contract.update({ where: { id: record.id }, data: { ...parsed.data, startsAt: new Date(parsed.data.startsAt), endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null, modules: parsed.data.modules || '[]' }, include: { tenant: { select: { name: true } }, documents: true } });
  await db.auditLog.create({ data: { tenantId: record.tenantId, actorId: session.userId, action: 'UPDATE', entity: 'Contract', entityId: record.id } });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !canManage(session.role)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  const record = await ownedRecord((await params).id);
  if (!record || !canAccessTenant(session, record.tenantId)) return NextResponse.json({ error: 'Registro não encontrado.' }, { status: 404 });
  const db = getDb();
  await db.contract.delete({ where: { id: record.id } });
  await db.auditLog.create({ data: { tenantId: record.tenantId, actorId: session.userId, action: 'DELETE', entity: 'Contract', entityId: record.id } });
  return NextResponse.json({ ok: true });
}
