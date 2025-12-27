import { Injectable } from '@nestjs/common';
import { EmailService } from 'src/email/email.service';
import { PrismaService } from 'src/prisma.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class MessageScheduler {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  @Cron('* * * * *')
  async process() {
    const messages = await this.prisma.messageOutbox.findMany({
      where: {
        sentAt: null,
        scheduledAt: { lte: new Date() },
      },
      take: 100,
    });

    for (const msg of messages) {
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
          data: { sentAt: new Date() },
        });
      } catch {
        await this.prisma.messageOutbox.update({
          where: { id: msg.id },
          data: { attempts: { increment: 1 } },
        });
      }
    }
  }
}
