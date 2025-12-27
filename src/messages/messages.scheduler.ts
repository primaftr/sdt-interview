import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EmailService } from '../email/email.service';
import pLimit from 'p-limit';
import { PrismaService } from 'src/prisma.service';
import { getBackoffDelay } from 'src/common/utils/backoff';
import { MessageOutbox, Prisma } from 'generated/prisma/client';

const BATCH_SIZE = 500;
const CONCURRENCY = 10;
const LOCK_TIMEOUT_MINUTES = 5;

@Injectable()
export class MessageScheduler {
  private readonly limit = pLimit(CONCURRENCY);

  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  @Cron('* * * * *') // every minute
  async processBatch() {
    const messages = await this.fetchAndLockBatch();

    if (messages.length === 0) return;

    await Promise.all(
      messages.map((msg) => this.limit(() => this.processMessage(msg))),
    );
  }

  // Fetches a bounded batch and locks rows so only ONE worker processes them.
  private async fetchAndLockBatch() {
    return this.prisma.$transaction(async (tx) => {
      const messages = await tx.$queryRaw<MessageOutbox[]>(
        Prisma.sql`
        SELECT *
        FROM "MessageOutbox"
        WHERE "sentAt" IS NULL
          AND "scheduledAt" <= NOW()
          AND (
            "nextRetryAt" IS NULL
            OR "nextRetryAt" <= NOW()
          )
          AND (
            "lockedAt" IS NULL
            OR "lockedAt" < NOW() - make_interval(mins => ${LOCK_TIMEOUT_MINUTES})
          )
        ORDER BY "scheduledAt"
        LIMIT ${BATCH_SIZE}
        FOR UPDATE SKIP LOCKED
      `,
      );

      if (messages.length === 0) return [];

      const ids = messages.map((m) => m.id);

      await tx.messageOutbox.updateMany({
        where: { id: { in: ids } },
        data: { lockedAt: new Date() },
      });

      return messages;
    });
  }
  //  Processes ONE message safely
  private async processMessage(msg: any) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: msg.userId },
      });

      if (!user) throw new Error('User not found');

      await this.email.send(
        user.email,
        `Hey, ${user.firstName} ${user.lastName} it's your birthday`,
      );

      await this.prisma.messageOutbox.update({
        where: { id: msg.id },
        data: {
          sentAt: new Date(),
          lockedAt: null,
        },
      });
    } catch (err) {
      const nextDelay = getBackoffDelay(msg.attempts + 1);

      await this.prisma.messageOutbox.update({
        where: { id: msg.id },
        data: {
          attempts: { increment: 1 },
          nextRetryAt: new Date(Date.now() + nextDelay),
          lockedAt: null,
        },
      });
    }
  }
}
