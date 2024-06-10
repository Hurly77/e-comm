import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StripeService } from './stripe.service';

@Injectable()
export class StripeJobService {
  private isCancelPIsRunning = false;
  private readonly logger = new Logger(StripeJobService.name);

  constructor(private stripeService: StripeService) {}

  @Cron(CronExpression.EVERY_10_HOURS)
  async cancelOldPaymentIntent() {
    this.logger.log('Cancelling old payment intents...');
    if (this.isCancelPIsRunning) {
      this.logger.warn('Cancelling payment intents already in progress...');
      return;
    }

    try {
      this.isCancelPIsRunning = true;
      const currDate = new Date();
      const [yyyy, mm, dd] = [currDate.getFullYear(), currDate.getMonth(), currDate.getDate()];

      const toOld = new Date(new Date(yyyy, mm, dd).setHours(0));
      const olderThanTime = toOld.getTime() / 1000; // convert to seconds for Stripe API

      const stripeSearchResult = await this.stripeService.paymentIntents.search({
        query: `created<${olderThanTime}`,
        limit: 100,
      });

      console.log(
        stripeSearchResult.total_count?.toString(),
        stripeSearchResult?.has_more,
        stripeSearchResult?.next_page,
      );
    } catch (err) {
    } finally {
      this.isCancelPIsRunning = false;
    }
  }
}
