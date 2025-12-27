import { Injectable } from '@nestjs/common';
import { MessageTypes } from './messages.type';
import { User } from 'generated/prisma/client';
import { DateTime } from 'luxon';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class MessageService {
  constructor(private prisma: PrismaService) {}

  async scheduleBirthday(user: User) {
    const now = DateTime.now().setZone(user.timezone);

    let scheduled = DateTime.fromJSDate(user.birthday, {
      zone: user.timezone,
    }).set({ year: now.year, hour: 9, minute: 0 });

    if (scheduled < now) {
      scheduled = scheduled.plus({ years: 1 });
    }

    await this.prisma.messageOutbox.create({
      data: {
        userId: user.id,
        messageType: MessageTypes.BIRTHDAY,
        scheduledAt: scheduled.toUTC().toJSDate(),
      },
    });
  }

  async rescheduleBirthday(user: User) {
    await this.prisma.messageOutbox.deleteMany({
      where: {
        userId: user.id,
        messageType: MessageTypes.BIRTHDAY,
        sentAt: null,
      },
    });

    await this.scheduleBirthday(user);
  }
}
