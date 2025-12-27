import { Module } from '@nestjs/common';
import { MessageService } from './messages.service';
import { MessageScheduler } from './messages.scheduler';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [EmailModule],
  providers: [MessageService, MessageScheduler],
  exports: [MessageService],
})
export class MessageModule {}
