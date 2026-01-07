-- CreateIndex
CREATE INDEX "products_tenantId_updatedAt_idx" ON "products"("tenantId", "updatedAt");

-- CreateIndex
CREATE INDEX "sales_tenantId_createdAt_idx" ON "sales"("tenantId", "createdAt");
