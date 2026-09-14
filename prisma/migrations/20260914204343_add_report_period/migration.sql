-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "periodEnd" TIMESTAMP(3),
ADD COLUMN     "periodStart" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Report_periodStart_idx" ON "Report"("periodStart");

-- CreateIndex
CREATE INDEX "Report_periodEnd_idx" ON "Report"("periodEnd");
