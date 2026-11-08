ALTER TABLE "WasteMeasurement" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Document" ADD COLUMN "measurementId" TEXT;
CREATE INDEX "Document_measurementId_idx" ON "Document"("measurementId");
