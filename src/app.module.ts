import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { ConfigModule } from '@nestjs/config';
import { EmailModule } from './email/email.module';
import { MessageModule } from './messages/messages.module';
import { PrismaModule } from './prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    UsersModule,
    MessageModule,
    EmailModule,
  ],
})
export class AppModule {}
