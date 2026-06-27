import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { zodToOpenAPI } from 'nestjs-zod';
import {
  DASHBOARD_PERMISSIONS,
  DashboardSummaryResponseSchema,
  type DashboardSummaryResponse,
} from '@stockflow/types';
import { type ActorContext, CurrentActor, RequirePermission } from '../../../common';
import { DashboardService } from '../application/dashboard.service';

@ApiTags('dashboard')
@Controller({ path: 'dashboard', version: '1' })
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('summary')
  @RequirePermission(DASHBOARD_PERMISSIONS.view)
  @ApiOperation({
    summary: 'Dashboard summary',
    description:
      'Requires `dashboard.view`. Overview KPIs, valuation-by-warehouse, top low-stock, and recent activity — in one round-trip.',
  })
  @ApiOkResponse({ schema: zodToOpenAPI(DashboardSummaryResponseSchema) })
  async summary(@CurrentActor() actor: ActorContext): Promise<DashboardSummaryResponse> {
    return this.service.getSummary(actor);
  }
}
