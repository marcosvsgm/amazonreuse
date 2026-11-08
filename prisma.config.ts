import { defineConfig } from 'prisma/config';

const databaseUrl = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
// O schema também usa env("DATABASE_URL"), portanto ela precisa existir
// durante a validação da CLI (inclusive quando o .env ainda não foi criado).
process.env.DATABASE_URL = databaseUrl;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'migrations' },
  // Em produção, informe DATABASE_URL no ambiente (veja .env.example).
  datasource: { url: databaseUrl },
});
