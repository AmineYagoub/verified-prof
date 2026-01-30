import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@verified-prof/prisma';
import { encrypt, AccountUpdatedDto, EVENTS } from '@verified-prof/shared';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async accountUpdated(input: AccountUpdatedDto): Promise<void> {
    const existing = await this.prisma.$.account.findFirst({
      where: {
        userId: input.userId,
        providerId: input.providerId,
      },
    });
    if (!existing) {
      this.logger.log(
        `Account with providerId ${input.providerId} for user ${input.userId} does not exist.`,
      );
      return;
    }

    await this.prisma.$.account.update({
      where: { id: existing.id },
      data: {
        accessToken: this.needsEncryption(existing.accessToken)
          ? encrypt(existing.accessToken, existing.userId)
          : existing.accessToken,
        refreshToken: this.needsEncryption(existing.refreshToken)
          ? encrypt(existing.refreshToken, existing.userId)
          : existing.refreshToken,
      },
    });

    this.eventEmitter.emit(EVENTS.ACCOUNT_UPDATED, {
      userId: input.userId,
      providerId: input.providerId,
    });
  }

  private needsEncryption(str: string | null): boolean {
    if (typeof str !== 'string' || str.length === 0) return false;
    return !/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/.test(
      str,
    );
  }
}
