import { MessageScheduler } from './messages.scheduler';

describe('MessageScheduler', () => {
  let mockPrisma: any;
  let mockEmail: any;
  let scheduler: MessageScheduler;

  beforeEach(() => {
    mockPrisma = {
      messageOutbox: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    mockEmail = {
      send: jest.fn(),
    };

    scheduler = new MessageScheduler(mockPrisma, mockEmail);
  });

  it('process() should send email and mark sentAt when user exists, and increment attempts when user missing', async () => {
    const now = new Date();

    const messages = [
      { id: 1, userId: 10, scheduledAt: now, sentAt: null },
      { id: 2, userId: 20, scheduledAt: now, sentAt: null },
    ];

    mockPrisma.messageOutbox.findMany.mockResolvedValue(messages);

    mockPrisma.user.findUnique.mockImplementation(
      ({ where: { id } }: { where: { id: number } }) => {
        if (id === 10)
          return {
            id: 10,
            email: 'a@example.com',
            firstName: 'A',
            lastName: 'User',
          };
        return null;
      },
    );

    mockEmail.send.mockResolvedValue(undefined);

    await scheduler.process();

    expect(mockPrisma.messageOutbox.findMany).toHaveBeenCalled();

    expect(mockEmail.send).toHaveBeenCalledWith(
      'a@example.com',
      expect.stringContaining('A User'),
    );

    expect(mockPrisma.messageOutbox.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { sentAt: expect.any(Date) },
    });

    expect(mockPrisma.messageOutbox.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { attempts: { increment: 1 } },
    });
  });

  it('process() should increment attempts when sending email throws', async () => {
    const now = new Date();
    const messages = [{ id: 3, userId: 30, scheduledAt: now, sentAt: null }];

    mockPrisma.messageOutbox.findMany.mockResolvedValue(messages);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 30,
      email: 'b@example.com',
      firstName: 'B',
      lastName: 'User',
    });

    mockEmail.send.mockRejectedValue(new Error('SMTP down'));

    await scheduler.process();

    expect(mockEmail.send).toHaveBeenCalledWith(
      'b@example.com',
      expect.stringContaining('B User'),
    );

    expect(mockPrisma.messageOutbox.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { attempts: { increment: 1 } },
    });
  });
});
