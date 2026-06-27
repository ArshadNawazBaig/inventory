import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { zodToOpenAPI } from 'nestjs-zod';
import {
  BILLING_PERMISSIONS,
  BillingUsageResponseSchema,
  PlanListResponseSchema,
  SubscriptionResponseSchema,
  type BillingUsageResponse,
  type PlanListResponse,
  type SubscriptionResponse,
} from '@stockflow/types';
import { type ActorContext, CurrentActor, RequirePermission } from '../../../common';
import { BillingService } from '../application/billing.service';
import { ChangePlanDto } from './dto';
import { toSubscriptionResponse } from './mappers';

@ApiTags('billing')
@Controller({ path: 'billing', version: '1' })
export class BillingController {
  constructor(private readonly service: BillingService) {}

  @Get('plans')
  @RequirePermission(BILLING_PERMISSIONS.view)
  @ApiOperation({ summary: 'List plans', description: 'Requires `billing.view`. The fixed plan catalog.' })
  @ApiOkResponse({ schema: zodToOpenAPI(PlanListResponseSchema) })
  plans(): PlanListResponse {
    return { plans: this.service.listPlans() };
  }

  @Get('subscription')
  @RequirePermission(BILLING_PERMISSIONS.view)
  @ApiOperation({
    summary: 'Get subscription',
    description: 'Requires `billing.view`. The tenant subscription, or the free-plan default if never set.',
  })
  @ApiOkResponse({ schema: zodToOpenAPI(SubscriptionResponseSchema) })
  async subscription(@CurrentActor() actor: ActorContext): Promise<SubscriptionResponse> {
    return toSubscriptionResponse(await this.service.getSubscription(actor));
  }

  @Post('subscription/change')
  @RequirePermission(BILLING_PERMISSIONS.manage)
  @ApiOperation({
    summary: 'Change plan',
    description: 'Requires `billing.manage`. Moves the tenant onto a plan via the billing provider.',
  })
  @ApiOkResponse({ schema: zodToOpenAPI(SubscriptionResponseSchema) })
  async changePlan(
    @CurrentActor() actor: ActorContext,
    @Body() body: ChangePlanDto,
  ): Promise<SubscriptionResponse> {
    return toSubscriptionResponse(await this.service.changePlan(actor, body.planId));
  }

  @Post('subscription/cancel')
  @RequirePermission(BILLING_PERMISSIONS.manage)
  @ApiOperation({
    summary: 'Cancel subscription',
    description: 'Requires `billing.manage`. Schedules cancellation at the end of the current period.',
  })
  @ApiOkResponse({ schema: zodToOpenAPI(SubscriptionResponseSchema) })
  async cancel(@CurrentActor() actor: ActorContext): Promise<SubscriptionResponse> {
    return toSubscriptionResponse(await this.service.cancel(actor));
  }

  @Get('usage')
  @RequirePermission(BILLING_PERMISSIONS.view)
  @ApiOperation({
    summary: 'Get usage',
    description: 'Requires `billing.view`. Current usage measured against the active plan limits.',
  })
  @ApiOkResponse({ schema: zodToOpenAPI(BillingUsageResponseSchema) })
  async usage(@CurrentActor() actor: ActorContext): Promise<BillingUsageResponse> {
    return this.service.getUsage(actor);
  }
}
