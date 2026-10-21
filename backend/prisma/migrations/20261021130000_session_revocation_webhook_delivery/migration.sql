-- AlterTable
ALTER TABLE "users" ADD COLUMN "token_version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "webhook_events" ADD COLUMN "delivery_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_delivery_id_key" ON "webhook_events"("delivery_id");
