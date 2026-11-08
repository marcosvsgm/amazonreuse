-- Keeps the D1 schema aligned with prisma/schema.prisma.
ALTER TABLE "WasteMeasurement" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING';
