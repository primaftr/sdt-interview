import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MessageModule } from 'src/messages/messages.module';

@Module({
  imports: [MessageModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
