import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { canAccessTenant, getSession } from '@/lib/auth';
const states = new Set(['OPEN', 'IN_CORRECTION', 'RESOLVED', 'OVERDUE']);
type Input = { inspectionId?: string; description?: string; severity?: string; responsible?: string; dueAt?: string; actionPlan?: string; status?: string };
export async function POST(request: Request) {
  const session = await getSession(); if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const input = await request.json() as Input;
  const inspection = await getDb().inspection.findUnique({ where: { id: String(input.inspectionId || '') } });
  if (!inspection || !canAccessTenant(session, inspection.tenantId) || !states.has(String(input.status || 'OPEN'))) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  const row = await getDb().nonConformity.create({ data: { tenantId: inspection.tenantId, inspectionId: inspection.id, description: String(input.description || ''), severity: String(input.severity || ''), responsible: String(input.responsible || ''), dueAt: input.dueAt ? new Date(input.dueAt) : null, actionPlan: String(input.actionPlan || ''), status: String(input.status || 'OPEN') } });
  await getDb().auditLog.create({ data: { tenantId: inspection.tenantId, actorId: session.userId, action: 'CREATE', entity: 'NonConformity', entityId: row.id } });
  return NextResponse.json(row, { status: 201 });
}
