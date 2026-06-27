import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { zodToOpenAPI } from 'nestjs-zod';
import {
  InventoryValuationResponseSchema,
  LowStockResponseSchema,
  REPORT_PERMISSIONS,
  type InventoryValuationResponse,
  type LowStockResponse,
} from '@stockflow/types';
import { type ActorContext, CurrentActor, RequirePermission } from '../../../common';
import { ReportsService } from '../application/reports.service';
import { InventoryValuationQueryDto, LowStockListQueryDto } from './dto';

function pageMeta(page: number, limit: number, total: number) {
  return { page: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

@ApiTags('reports')
@Controller({ path: 'reports', version: '1' })
export class ReportController {
  constructor(private readonly service: ReportsService) {}

  @Get('inventory-valuation')
  @RequirePermission(REPORT_PERMISSIONS.view)
  @ApiOperation({
    summary: 'Inventory valuation',
    description: 'Requires `report.view`. Stock valued at weighted-average cost, with a by-warehouse breakdown.',
  })
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiOkResponse({ schema: zodToOpenAPI(InventoryValuationResponseSchema) })
  async inventoryValuation(
    @CurrentActor() actor: ActorContext,
    @Query() query: InventoryValuationQueryDto,
  ): Promise<InventoryValuationResponse> {
    return this.service.inventoryValuation(actor, query);
  }

  @Get('low-stock')
  @RequirePermission(REPORT_PERMISSIONS.view)
  @ApiOperation({
    summary: 'Low-stock (reorder) report',
    description: 'Requires `report.view`. Reorder-eligible variants at/below their reorder point (incl. out of stock).',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ schema: zodToOpenAPI(LowStockResponseSchema) })
  async lowStock(
    @CurrentActor() actor: ActorContext,
    @Query() query: LowStockListQueryDto,
  ): Promise<LowStockResponse> {
    const result = await this.service.lowStock(actor, query);
    return { data: result.items, meta: pageMeta(result.page, result.limit, result.total) };
  }
}
