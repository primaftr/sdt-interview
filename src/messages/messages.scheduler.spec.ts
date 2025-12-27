jest.mock('p-limit', () => {
  // export as default to match `import pLimit from 'p-limit'`
  return { default: jest.fn().mockImplementation(() => (fn: any) => fn()) };
});

import { MessageScheduler } from './messages.scheduler';

describe('MessageScheduler', () => {
  let mockPrisma: any;
  let mockEmail: any;
  let scheduler: MessageScheduler;

  beforeEach(() => {
    mockPrisma = {
      // $transaction will be mocked per-test to provide a tx with $queryRaw
      $transaction: jest.fn(),
      messageOutbox: {
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

  it('processBatch() should send email and mark sentAt when user exists, and increment attempts when user missing', async () => {
    const now = new Date();

    const messages = [
      { id: 1, userId: 10, scheduledAt: now, sentAt: null },
      { id: 2, userId: 20, scheduledAt: now, sentAt: null },
    ];
    // mock the transaction to call the provided callback with a tx-like object
    mockPrisma.$transaction.mockImplementationOnce(async (fn: any) =>
      fn({
        $queryRaw: jest.fn().mockResolvedValue(messages),
        messageOutbox: { updateMany: jest.fn() },
      }),
    );

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

    await scheduler.processBatch();

    expect(mockPrisma.$transaction).toHaveBeenCalled();

    expect(mockEmail.send).toHaveBeenCalledWith(
      'a@example.com',
      expect.stringContaining('A User'),
    );

    expect(mockPrisma.messageOutbox.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { sentAt: expect.any(Date), lockedAt: null },
    });

    expect(mockPrisma.messageOutbox.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: {
        attempts: { increment: 1 },
        nextRetryAt: expect.any(Date),
        lockedAt: null,
      },
    });
  });

  it('processBatch() should increment attempts when sending email throws', async () => {
    const now = new Date();
    const messages = [{ id: 3, userId: 30, scheduledAt: now, sentAt: null }];
    mockPrisma.$transaction.mockImplementationOnce(async (fn: any) =>
      fn({
        $queryRaw: jest.fn().mockResolvedValue(messages),
        messageOutbox: { updateMany: jest.fn() },
      }),
    );

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 30,
      email: 'b@example.com',
      firstName: 'B',
      lastName: 'User',
    });

    mockEmail.send.mockRejectedValue(new Error('SMTP down'));

    await scheduler.processBatch();

    expect(mockEmail.send).toHaveBeenCalledWith(
      'b@example.com',
      expect.stringContaining('B User'),
    );

    expect(mockPrisma.messageOutbox.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: {
        attempts: { increment: 1 },
        nextRetryAt: expect.any(Date),
        lockedAt: null,
      },
    });
  });
});
