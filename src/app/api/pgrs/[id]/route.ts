import { NextResponse } from 'next/server';
import { canAccessTenant, getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { deleteDocument, logDocumentStorageError, uploadDocument } from '@/lib/document-storage';

async function ownedDocument(id: string) {
  const session = await getSession();
  const document = session ? await getDb().document.findUnique({ where: { id } }) : null;
  return { session, document: document && document.type === 'PGRS' && canAccessTenant(session!, document.tenantId) ? document : null };
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, document } = await ownedDocument((await params).id);
  if (!session || !document) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  const form = await request.formData(); const file = form.get('file');
  if (!(file instanceof File) || file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf') || !file.size || file.size > Number(process.env.PGRS_MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024)) return NextResponse.json({ error: 'Envie um PDF válido dentro do limite configurado.' }, { status: 400 });
  try {
    const replacement = await uploadDocument(`${document.tenantId}/pgrs/${crypto.randomUUID()}.pdf`, file, { contentType: 'application/pdf' });
    await deleteDocument(document.storageKey);
    await getDb().document.update({ where: { id: document.id }, data: { storageKey: replacement.url } });
  } catch (error) {
    logDocumentStorageError('replace', error);
    return NextResponse.json({ error: 'NÃ£o foi possÃ­vel substituir o PDF. Tente novamente.' }, { status: 503 });
  }
  await getDb().auditLog.create({ data: { tenantId: document.tenantId, actorId: session.userId, action: 'REPLACE_FILE', entity: 'Document', entityId: document.id } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, document } = await ownedDocument((await params).id);
  if (!session || !document) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  try {
    await deleteDocument(document.storageKey);
  } catch (error) {
    logDocumentStorageError('delete', error);
    return NextResponse.json({ error: 'NÃ£o foi possÃ­vel excluir o PDF. Tente novamente.' }, { status: 503 });
  }
  await getDb().document.delete({ where: { id: document.id } });
  await getDb().auditLog.create({ data: { tenantId: document.tenantId, actorId: session.userId, action: 'DELETE', entity: 'Document', entityId: document.id } });
  return new NextResponse(null, { status: 204 });
}
