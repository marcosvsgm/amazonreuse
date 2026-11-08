import { del, put } from '@vercel/blob';

type UploadOptions = { contentType?: string };

export async function uploadDocument(key: string, body: File, options: UploadOptions = {}) {
  return put(key, body, {
    access: 'public',
    addRandomSuffix: true,
    contentType: options.contentType,
  });
}

export async function deleteDocument(url: string) {
  await del(url);
}

export async function downloadDocument(url: string) {
  const response = await fetch(url);
  return response.ok ? response : null;
}

export function logDocumentStorageError(operation: string, error: unknown) {
  console.error(JSON.stringify({
    event: 'documents.storage_failed', operation,
    errorName: error instanceof Error ? error.name : 'UnknownError',
    message: error instanceof Error ? error.message.slice(0, 500) : 'Non-Error value thrown by document storage.',
  }));
}
