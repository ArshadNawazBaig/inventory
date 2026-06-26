import { Module } from '@nestjs/common';

/**
 * Worker root module. BullMQ queue processors are registered here in later phases
 * (imports, exports, reports, emails, webhooks, low-stock alerts).
 */
@Module({
  imports: [],
  providers: [],
})
export class AppModule {}
