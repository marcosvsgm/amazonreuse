import { cache } from 'react';
import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export const getDb = cache(() => {
  const { env } = getCloudflareContext<{ DB: D1Database }>();
  if (!env.DB) {
    console.error(JSON.stringify({ event: 'database.binding_missing', binding: 'DB' }));
    throw new Error('D1 binding DB is unavailable.');
  }
  return new PrismaClient({ adapter: new PrismaD1(env.DB) });
});
