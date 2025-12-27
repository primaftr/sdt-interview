-- DropIndex
DROP INDEX "MessageOutbox_userId_messageType_scheduledAt_key";

-- AlterTable
ALTER TABLE "MessageOutbox" ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "nextRetryAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "MessageOutbox_sentAt_scheduledAt_nextRetryAt_idx" ON "MessageOutbox"("sentAt", "scheduledAt", "nextRetryAt");
