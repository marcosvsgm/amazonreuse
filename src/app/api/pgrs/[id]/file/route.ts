import { NextResponse } from 'next/server';
import { canAccessTenant, getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { getDocumentsBucket, logDocumentStorageError } from '@/lib/document-storage';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const document = session ? await getDb().document.findUnique({ where: { id: (await params).id } }) : null;
  if (!session || !document || document.type !== 'PGRS' || !canAccessTenant(session, document.tenantId)) return new NextResponse('Não encontrado', { status: 404 });
  let file: R2ObjectBody | null;
  try {
    file = await getDocumentsBucket().get(document.storageKey);
  } catch (error) {
    logDocumentStorageError('download', error);
    return new NextResponse('ServiÃ§o de documentos indisponÃ­vel', { status: 503 });
  }
  if (!file) return new NextResponse('Arquivo não encontrado', { status: 404 });
  const download = new URL(request.url).searchParams.get('download') === '1';
  return new NextResponse(file.body, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${document.title.replaceAll('"', '')}.pdf"` } });
}
