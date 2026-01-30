import { Body, Controller, Post } from '@nestjs/common';
import { OptionalAuth } from '@thallesp/nestjs-better-auth';
import { WebhookService } from './webhook.service';
import { AccountUpdatedDto } from '@verified-prof/shared';

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('account-updated')
  @OptionalAuth()
  async accountUpdated(@Body() body: AccountUpdatedDto) {
    await this.webhookService.accountUpdated(body);
  }
}
