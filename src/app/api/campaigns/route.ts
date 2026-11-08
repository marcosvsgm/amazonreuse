import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '@/lib/db';
import { canAccessTenant, getSession } from '@/lib/auth';

const types = new Set(['CAMPAIGN', 'TRAINING']);
const statuses = new Set(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
const themes = new Set(['RECYCLING', 'SELECTIVE_COLLECTION', 'SOLID_WASTE', 'ENVIRONMENTAL_EDUCATION', 'OTHER']);

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  return NextResponse.json(await getDb().campaign.findMany({
    where: session.role === 'SUPER_ADMIN' ? {} : { tenantId: session.tenantId ?? '' },
    include: { tenant: { select: { name: true } }, unit: { select: { name: true } }, attachments: true }, orderBy: { startsAt: 'desc' },
  }));
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const form = await req.formData();
  const tenantId = String(form.get('tenantId') || session.tenantId || '');
  const unitId = String(form.get('unitId') || '');
  const title = String(form.get('title') || '').trim();
  const type = String(form.get('type') || ''); const theme = String(form.get('theme') || '');
  const status = String(form.get('status') || 'PLANNED'); const startsAt = String(form.get('startsAt') || '');
  const attendees = Number(form.get('attendees') || 0);
  if (!canAccessTenant(session, tenantId) || !title || !types.has(type) || !themes.has(theme) || !statuses.has(status) || !startsAt || !Number.isInteger(attendees) || attendees < 0 || !unitId || !await getDb().unit.findFirst({ where: { id: unitId, tenantId } })) return NextResponse.json({ error: 'Preencha os campos obrigatórios corretamente.' }, { status: 400 });
  const files = form.getAll('attachments').filter((x): x is File => x instanceof File && x.size > 0);
  if (files.some(file => file.size > 10 * 1024 * 1024)) return NextResponse.json({ error: 'Cada anexo deve ter no máximo 10 MB.' }, { status: 400 });
  const row = await getDb().campaign.create({ data: { tenantId, unitId, title, type, theme, status, startsAt: new Date(startsAt), attendees, description: String(form.get('description') || ''), objectives: String(form.get('objectives') || ''), location: String(form.get('location') || ''), responsible: String(form.get('responsible') || '') } });
  if (files.length) { const { env } = getCloudflareContext<{ DOCUMENTS: R2Bucket }>(); for (const file of files) { const key = `${tenantId}/campaigns/${row.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, '_')}`; await env.DOCUMENTS.put(key, await file.arrayBuffer()); await getDb().campaignAttachment.create({ data: { campaignId: row.id, name: file.name, storageKey: key } }); } }
  await getDb().auditLog.create({ data: { tenantId, actorId: session.userId, action: 'CREATE', entity: 'Campaign', entityId: row.id } });
  return NextResponse.json(row, { status: 201 });
}
