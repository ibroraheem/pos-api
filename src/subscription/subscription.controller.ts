import { Controller, Post, Body } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) { }

  @Post('webhook')
  handleWebhook(@Body() payload: any) {
    return this.subscriptionService.handleWebhook(payload);
  }
}
