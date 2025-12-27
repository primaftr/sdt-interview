-- DropForeignKey
ALTER TABLE "MessageOutbox" DROP CONSTRAINT "MessageOutbox_userId_fkey";

-- AddForeignKey
ALTER TABLE "MessageOutbox" ADD CONSTRAINT "MessageOutbox_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
