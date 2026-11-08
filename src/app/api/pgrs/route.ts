import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { canAccessTenant, getSession } from '@/lib/auth';
import { getDocumentsBucket, logDocumentStorageError, pdfHttpMetadata } from '@/lib/document-storage';

// Can be made configurable at deploy time without changing the application.
const maxUploadBytes = Number(process.env.PGRS_MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024);
const pgrsStatuses = new Set(['ACTIVE', 'PENDING']);

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const documents = await getDb().document.findMany({
    where: { type: 'PGRS', ...(session.role === 'SUPER_ADMIN' ? {} : { tenantId: session.tenantId ?? '' }) },
    include: { tenant: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(documents);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const form = await request.formData();
  const file = form.get('file');
  const tenantId = String(form.get('tenantId') || session.tenantId || '');
  const unitId = String(form.get('unitId') || '');
  const title = String(form.get('title') || '').trim();
  const status = String(form.get('status') || 'ACTIVE');
  if (!canAccessTenant(session, tenantId) || !title || !pgrsStatuses.has(status) || !(file instanceof File)) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  }
  if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json({ error: 'Envie somente arquivos PDF.' }, { status: 400 });
  }
  if (!file.size || file.size > maxUploadBytes) {
    return NextResponse.json({ error: `O PDF deve ter no máximo ${Math.floor(maxUploadBytes / 1024 / 1024)} MB.` }, { status: 400 });
  }
  if (unitId) {
    const unit = await getDb().unit.findFirst({ where: { id: unitId, tenantId } });
    if (!unit) return NextResponse.json({ error: 'Unidade inválida para esta empresa.' }, { status: 400 });
  }

  const key = `${tenantId}/pgrs/${crypto.randomUUID()}.pdf`;
  let bucket: R2Bucket;
  try {
    bucket = getDocumentsBucket();
    await bucket.put(key, file.stream(), { httpMetadata: pdfHttpMetadata(file.name) });
  } catch (error) {
    logDocumentStorageError('upload', error);
    return NextResponse.json({ error: 'NÃ£o foi possÃ­vel armazenar o PDF. Tente novamente.' }, { status: 503 });
  }

  const validUntilValue = String(form.get('validUntil') || '');
  let document;
  try {
    document = await getDb().document.create({
      data: { tenantId, unitId: unitId || null, title, type: 'PGRS', storageKey: key, status, validUntil: validUntilValue ? new Date(`${validUntilValue}T12:00:00.000Z`) : null },
    });
  } catch (error) {
    logDocumentStorageError('create_metadata', error);
    try {
      await bucket.delete(key);
    } catch (cleanupError) {
      logDocumentStorageError('cleanup_orphan_after_metadata_failure', cleanupError);
    }
    return NextResponse.json({ error: 'NÃ£o foi possÃ­vel registrar o PDF. Tente novamente.' }, { status: 503 });
  }
  await getDb().auditLog.create({ data: { tenantId, actorId: session.userId, action: 'UPLOAD', entity: 'Document', entityId: document.id } });
  return NextResponse.json(document, { status: 201 });
}
