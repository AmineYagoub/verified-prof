import { Module } from '@nestjs/common';
import { DbModule } from '@verified-prof/prisma';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';

@Module({
  imports: [DbModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
