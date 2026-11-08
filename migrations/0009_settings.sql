CREATE TABLE "Setting" ("id" TEXT NOT NULL PRIMARY KEY,"tenantId" TEXT,"userId" TEXT,"scope" TEXT NOT NULL,"key" TEXT NOT NULL,"value" TEXT NOT NULL,"updatedAt" DATETIME NOT NULL);
CREATE UNIQUE INDEX "Setting_tenantId_userId_scope_key_key" ON "Setting"("tenantId","userId","scope","key");
