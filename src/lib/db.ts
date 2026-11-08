import { cache } from 'react';
import { PrismaClient } from '@prisma/client';

export const getDb = cache(() => {
  return new PrismaClient();
});
