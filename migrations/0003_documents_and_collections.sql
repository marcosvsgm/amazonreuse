ALTER TABLE "Document" ADD COLUMN "unitId" TEXT;
ALTER TABLE "Document" ADD COLUMN "validUntil" DATETIME;
CREATE INDEX "Document_tenantId_validUntil_idx" ON "Document"("tenantId", "validUntil");

CREATE TABLE "Collection" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "unitId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "wasteType" TEXT NOT NULL,
  "quantityKg" DECIMAL NOT NULL,
  "collectedAt" DATETIME NOT NULL,
  "transporter" TEXT NOT NULL,
  "finalDestination" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "receiptKey" TEXT,
  "receiptName" TEXT,
  "cdfKey" TEXT,
  "cdfName" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Collection_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Collection_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Collection_tenantId_code_key" ON "Collection"("tenantId", "code");
CREATE INDEX "Collection_tenantId_collectedAt_idx" ON "Collection"("tenantId", "collectedAt");
CREATE INDEX "Collection_unitId_status_idx" ON "Collection"("unitId", "status");
