import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { canAccessTenant, getSession } from '@/lib/auth';

const input = z.object({
  tenantId: z.string(),
  unitId: z.string(),
  wasteType: z.string().min(2),
  classification: z.string().min(2),
  weightKg: z.number().positive(),
  source: z.enum(['ESTIMATED', 'WEIGHED']),
  status: z.enum(['PENDING', 'DESTINED', 'RECYCLED']).default('PENDING'),
  measuredAt: z.string().datetime(),
});

export async function GET(request: Request) {
  const db = getDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const tenantId = new URL(request.url).searchParams.get('tenantId') || session.tenantId;
  if (!tenantId || !canAccessTenant(session, tenantId)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  return NextResponse.json(await db.wasteMeasurement.findMany({ where: { tenantId }, include: { unit: true, documents: { select: { id: true, title: true } } }, orderBy: { measuredAt: 'desc' } }));
}

export async function POST(request: Request) {
  const db = getDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos', issues: parsed.error.flatten() }, { status: 400 });
  if (!canAccessTenant(session, parsed.data.tenantId)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const unit = await db.unit.findFirst({ where: { id: parsed.data.unitId, tenantId: parsed.data.tenantId } });
  if (!unit) return NextResponse.json({ error: 'Unidade inválida' }, { status: 400 });

  const measurement = await db.wasteMeasurement.create({ data: { ...parsed.data, measuredAt: new Date(parsed.data.measuredAt), createdById: session.userId } });
  await db.auditLog.create({ data: { tenantId: parsed.data.tenantId, actorId: session.userId, action: 'CREATE', entity: 'WasteMeasurement', entityId: measurement.id } });
  return NextResponse.json(measurement, { status: 201 });
}
