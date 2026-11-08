import { getCloudflareContext } from '@opennextjs/cloudflare';

type SafeStorageError = {
  errorName: string;
  message: string;
  code?: string;
};

function safeStorageError(error: unknown): SafeStorageError {
  if (error instanceof Error) {
    const errorWithCode = error as Error & { code?: unknown };
    const code = typeof errorWithCode.code === 'string'
      ? errorWithCode.code
      : undefined;

    return { errorName: error.name, message: error.message.slice(0, 500), ...(code ? { code } : {}) };
  }

  return { errorName: 'UnknownError', message: 'Non-Error value thrown by document storage.' };
}

export function getDocumentsBucket(): R2Bucket {
  const { env } = getCloudflareContext<{ DOCUMENTS?: R2Bucket }>();
  if (!env.DOCUMENTS) {
    console.error(JSON.stringify({ event: 'documents.binding_missing', binding: 'DOCUMENTS' }));
    throw new Error('R2 DOCUMENTS binding is unavailable.');
  }

  return env.DOCUMENTS;
}

export function logDocumentStorageError(operation: string, error: unknown) {
  console.error(JSON.stringify({
    event: 'documents.storage_failed',
    operation,
    ...safeStorageError(error),
  }));
}

export function pdfHttpMetadata(fileName: string): R2HTTPMetadata {
  return {
    contentType: 'application/pdf',
    contentDisposition: `inline; filename="${fileName.replaceAll('"', '')}"`,
  };
}
