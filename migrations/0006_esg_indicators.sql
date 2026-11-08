CREATE TABLE "EsgIndicator" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "unitId" TEXT,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "unitLabel" TEXT NOT NULL,
  "value" DECIMAL NOT NULL,
  "target" DECIMAL,
  "period" DATETIME NOT NULL,
  "responsible" TEXT NOT NULL,
  "notes" TEXT NOT NULL DEFAULT '',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL
);
CREATE INDEX "EsgIndicator_tenantId_period_idx" ON "EsgIndicator"("tenantId", "period");
CREATE INDEX "EsgIndicator_unitId_category_idx" ON "EsgIndicator"("unitId", "category");
