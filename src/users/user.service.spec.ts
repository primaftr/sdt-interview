import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { MessageService } from 'src/messages/messages.service';
import { PrismaService } from 'src/prisma.service';
import { Prisma } from 'generated/prisma/client';
import { ConflictException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;
  let message: any;

  beforeEach(async () => {
    prisma = {
      user: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    message = {
      scheduleBirthday: jest.fn(),
      rescheduleBirthday: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: MessageService, useValue: message },
      ],
    }).compile();
    prisma = module.get<PrismaService>(PrismaService);
    service = module.get(UsersService);
  });

  it('create should create user and schedule birthday', async () => {
    const dto = {
      firstName: 'Alice',
      lastName: 'Author',
      birthday: '1990-01-01',
      timezone: 'UTC',
      email: 'a@b.com',
    };
    const created = { id: '1', ...dto, birthday: new Date(dto.birthday) };
    prisma.user.create.mockResolvedValue(created);

    const res = await service.create(dto as any);

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ firstName: dto.firstName }),
      }),
    );
    expect(message.scheduleBirthday).toHaveBeenCalledWith(created);
    expect(res).toBe(created);
  });

  it('should throw error if user duplicate on create', async () => {
    const dto = {
      firstName: 'Alice',
      lastName: 'Author',
      birthday: '1990-01-01',
      timezone: 'UTC',
      email: 'a@b.com',
    };

    const prismaErr: any = new Error('Unique constraint failed');
    prismaErr.code = 'P2002';
    Object.setPrototypeOf(
      prismaErr,
      (Prisma as any).PrismaClientKnownRequestError.prototype,
    );

    prisma.user.create.mockRejectedValue(prismaErr);

    await expect(service.create(dto as any)).rejects.toBeInstanceOf(
      ConflictException,
    );
    await expect(service.create(dto as any)).rejects.toThrow(
      'Email already exists',
    );
  });

  it('update should update and reschedule', async () => {
    const email = 'b@b.com';
    const dto = { firstName: 'Bob' };
    const updated = {
      id: '1',
      firstName: 'Bob',
      birthday: new Date('1990-02-02'),
      timezone: 'UTC',
      email,
    };
    prisma.user.update.mockResolvedValue(updated);

    const res = await service.update(email, dto as any);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: email } }),
    );
    expect(message.rescheduleBirthday).toHaveBeenCalledWith(updated);
    expect(res).toBe(updated);
  });

  it('remove should delete user', async () => {
    const email = 'b@b.com';
    prisma.user.delete.mockResolvedValue({});
    await service.remove(email);
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { email } });
  });
});
