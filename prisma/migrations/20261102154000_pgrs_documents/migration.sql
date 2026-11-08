ALTER TABLE "Document" ADD COLUMN "unitId" TEXT;
ALTER TABLE "Document" ADD COLUMN "validUntil" DATETIME;
CREATE INDEX "Document_tenantId_validUntil_idx" ON "Document"("tenantId", "validUntil");
