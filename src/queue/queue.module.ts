import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueGateway } from './queue.gateway';
import { QueueController } from './queue.controller';

@Module({
  providers: [QueueService, QueueGateway],
  controllers: [QueueController],
})
export class QueueModule {}
