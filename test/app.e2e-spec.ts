import { Test } from '@nestjs/testing';
import { webcrypto as nodeWebcrypto } from 'crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { MessageService } from '../src/messages/messages.service';

// Ensure Web Crypto API is available in the Jest/node test environment
if (!(global as any).crypto) {
  (global as any).crypto = nodeWebcrypto as unknown;
}

jest.mock('p-limit', () => {
  // export as default to match `import pLimit from 'p-limit'`
  return { default: jest.fn().mockImplementation(() => (fn: any) => fn()) };
});

describe('App (e2e)', () => {
  let app: INestApplication;
  let prismaMock: any;
  let messageMock: any;

  beforeAll(async () => {
    prismaMock = {
      user: {
        create: jest.fn().mockResolvedValue({
          id: '1',
          firstName: 'Jane',
          lastName: 'Doe',
          birthday: new Date('1990-01-01'),
          timezone: 'UTC',
          email: 'a@b.com',
        }),
        update: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue(null),

        delete: jest.fn().mockResolvedValue({}),
      },
      messageOutbox: {
        create: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    messageMock = {
      scheduleBirthday: jest.fn().mockResolvedValue(undefined),
      rescheduleBirthday: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(MessageService)
      .useValue(messageMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /user -> creates user and schedules birthday', async () => {
    const dto = {
      firstName: 'Jane',
      lastName: 'Doe',
      birthday: '1990-01-01',
      timezone: 'UTC',
      email: 'a@b.com',
    };

    const res = await request(app.getHttpServer())
      .post('/user')
      .send(dto)
      .expect(201);

    expect(prismaMock.user.create).toHaveBeenCalled();
    expect(messageMock.scheduleBirthday).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1' }),
    );

    expect(res.body).toMatchObject({
      id: '1',
      firstName: 'Jane',
      lastName: 'Doe',
      timezone: 'UTC',
      email: 'a@b.com',
    });
  });

  it('DELETE /user/:email -> deletes user', async () => {
    prismaMock.user.delete.mockResolvedValueOnce({});
    await request(app.getHttpServer()).delete('/user/a@b.com').expect(200);
    expect(prismaMock.user.delete).toHaveBeenCalledWith({
      where: { email: 'a@b.com' },
    });
  });
});
