import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { zodToOpenAPI } from 'nestjs-zod';
import {
  AdjustmentResultSchema,
  CreateAdjustmentRequestSchema,
  INVENTORY_PERMISSIONS,
  STOCK_MOVEMENT_TYPES,
  StockLevelListResponseSchema,
  StockMovementListResponseSchema,
  type AdjustmentResult,
  type StockLevelListResponse,
  type StockMovementListResponse,
} from '@stockflow/types';
import { type ActorContext, CurrentActor, RequirePermission } from '../../../common';
import { InventoryService } from '../application/inventory.service';
import { CreateAdjustmentDto, StockLevelListQueryDto, StockMovementListQueryDto } from './dto';
import { toStockLevelResponse, toStockMovementResponse } from './mappers';

function pageMeta(page: number, limit: number, total: number) {
  return { page: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

const ADJUSTMENT_RESULT_SCHEMA = zodToOpenAPI(AdjustmentResultSchema);
const LEVEL_LIST_SCHEMA = zodToOpenAPI(StockLevelListResponseSchema);
const MOVEMENT_LIST_SCHEMA = zodToOpenAPI(StockMovementListResponseSchema);

@ApiTags('inventory')
@Controller({ path: 'inventory', version: '1' })
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get('levels')
  @RequirePermission(INVENTORY_PERMISSIONS.view)
  @ApiOperation({
    summary: 'List stock levels',
    description: 'Requires `inventory.view`. The on-hand projection per (variant × location).',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({ name: 'variantId', required: false })
  @ApiQuery({ name: 'locationId', required: false })
  @ApiOkResponse({ schema: LEVEL_LIST_SCHEMA })
  async listLevels(
    @CurrentActor() actor: ActorContext,
    @Query() query: StockLevelListQueryDto,
  ): Promise<StockLevelListResponse> {
    const result = await this.service.listLevels(actor, query);
    return {
      data: result.items.map(toStockLevelResponse),
      meta: pageMeta(result.page, result.limit, result.total),
    };
  }

  @Get('movements')
  @RequirePermission(INVENTORY_PERMISSIONS.view)
  @ApiOperation({
    summary: 'List stock movements (the ledger)',
    description: 'Requires `inventory.view`. The append-only history; newest first by default.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({ name: 'variantId', required: false })
  @ApiQuery({ name: 'locationId', required: false })
  @ApiQuery({ name: 'type', required: false, enum: STOCK_MOVEMENT_TYPES })
  @ApiOkResponse({ schema: MOVEMENT_LIST_SCHEMA })
  async listMovements(
    @CurrentActor() actor: ActorContext,
    @Query() query: StockMovementListQueryDto,
  ): Promise<StockMovementListResponse> {
    const result = await this.service.listMovements(actor, query);
    return {
      data: result.items.map(toStockMovementResponse),
      meta: pageMeta(result.page, result.limit, result.total),
    };
  }

  @Post('adjustments')
  @RequirePermission(INVENTORY_PERMISSIONS.adjust)
  @ApiOperation({
    summary: 'Post a manual stock adjustment',
    description:
      'Requires `inventory.adjust`. Appends one immutable ledger entry and recomputes the projection ' +
      'atomically. Idempotent on `opKey`.',
  })
  @ApiBody({ schema: zodToOpenAPI(CreateAdjustmentRequestSchema) })
  @ApiCreatedResponse({ schema: ADJUSTMENT_RESULT_SCHEMA })
  async adjust(
    @CurrentActor() actor: ActorContext,
    @Body() body: CreateAdjustmentDto,
  ): Promise<AdjustmentResult> {
    const { movement, level } = await this.service.adjust(actor, body);
    return { movement: toStockMovementResponse(movement), level: toStockLevelResponse(level) };
  }
}
