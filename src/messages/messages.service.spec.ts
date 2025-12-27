import { MessageService } from './messages.service';
import { DateTime } from 'luxon';
import { MessageTypes } from './messages.type';

describe('MessageService', () => {
  let service: MessageService;
  let prismaMock: any;
  let nowSpy: jest.SpyInstance<DateTime, []>;

  beforeEach(() => {
    prismaMock = {
      messageOutbox: {
        create: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({}),
      },
    };

    service = new MessageService(prismaMock as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (nowSpy) nowSpy.mockRestore();
  });

  it('schedules birthday later this year when birthday not passed', async () => {
    // now: 2025-12-27 UTC
    const now = DateTime.fromISO('2025-12-27T08:00:00', { zone: 'UTC' });
    nowSpy = jest
      .spyOn(DateTime, 'now')
      .mockImplementation(() => now as DateTime<true>);

    const user: any = {
      id: 1,
      birthday: new Date('1990-12-28T00:00:00Z'),
      timezone: 'UTC',
    };

    await service.scheduleBirthday(user);

    expect(prismaMock.messageOutbox.create).toHaveBeenCalledTimes(1);
    const call = prismaMock.messageOutbox.create.mock.calls[0][0];
    expect(call.data.userId).toBe(1);
    expect(call.data.messageType).toBe(MessageTypes.BIRTHDAY);
    // scheduled for 2025-12-28 09:00 UTC
    expect(call.data.scheduledAt.toISOString()).toBe(
      '2025-12-28T09:00:00.000Z',
    );
  });

  it('schedules birthday next year when this year has passed', async () => {
    // now: 2025-12-27 UTC
    const now = DateTime.fromISO('2025-12-27T08:00:00', { zone: 'UTC' });
    nowSpy = jest
      .spyOn(DateTime, 'now')
      .mockImplementation(() => now as DateTime<true>);

    const user: any = {
      id: 2,
      birthday: new Date('1990-01-01T00:00:00Z'),
      timezone: 'UTC',
    };

    await service.scheduleBirthday(user);

    expect(prismaMock.messageOutbox.create).toHaveBeenCalledTimes(1);
    const call = prismaMock.messageOutbox.create.mock.calls[0][0];
    // since Jan 1 2025 has passed relative to Dec 27 2025, expect 2026
    expect(call.data.scheduledAt.toISOString()).toBe(
      '2026-01-01T09:00:00.000Z',
    );
  });

  it('reschedules by deleting pending and creating a new outbox entry', async () => {
    const now = DateTime.fromISO('2025-12-27T08:00:00', { zone: 'UTC' });
    nowSpy = jest
      .spyOn(DateTime, 'now')
      .mockImplementation(() => now as DateTime<true>);

    const user: any = {
      id: 3,
      birthday: new Date('1990-06-15T00:00:00Z'),
      timezone: 'UTC',
    };

    await service.rescheduleBirthday(user);

    expect(prismaMock.messageOutbox.deleteMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.messageOutbox.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: user.id,
        messageType: MessageTypes.BIRTHDAY,
        sentAt: null,
      },
    });

    expect(prismaMock.messageOutbox.create).toHaveBeenCalledTimes(1);
  });
});
