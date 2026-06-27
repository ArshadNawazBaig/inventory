import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
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
  CreatePurchaseOrderRequestSchema,
  PURCHASE_ORDER_PERMISSIONS,
  PURCHASE_ORDER_STATUS,
  PurchaseOrderListResponseSchema,
  PurchaseOrderResponseSchema,
  ReceivePurchaseOrderRequestSchema,
  UpdatePurchaseOrderRequestSchema,
  type PurchaseOrderListResponse,
  type PurchaseOrderResponse,
} from '@stockflow/types';
import { type ActorContext, CurrentActor, RequirePermission } from '../../../common';
import { PurchasingService } from '../application/purchasing.service';
import {
  CreatePurchaseOrderDto,
  PurchaseOrderListQueryDto,
  ReceivePurchaseOrderDto,
  UpdatePurchaseOrderDto,
} from './dto';
import { toPurchaseOrderResponse, toPurchaseOrderSummary } from './mappers';

function pageMeta(page: number, limit: number, total: number) {
  return { page: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

const PO_SCHEMA = zodToOpenAPI(PurchaseOrderResponseSchema);
const PO_LIST_SCHEMA = zodToOpenAPI(PurchaseOrderListResponseSchema);

@ApiTags('purchase-orders')
@Controller({ path: 'purchase-orders', version: '1' })
export class PurchaseOrderController {
  constructor(private readonly service: PurchasingService) {}

  @Get()
  @RequirePermission(PURCHASE_ORDER_PERMISSIONS.view)
  @ApiOperation({ summary: 'List purchase orders', description: 'Requires `purchase_order.view`.' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({ name: 'status', required: false, enum: PURCHASE_ORDER_STATUS })
  @ApiQuery({ name: 'supplierId', required: false })
  @ApiQuery({ name: 'q', required: false })
  @ApiOkResponse({ schema: PO_LIST_SCHEMA })
  async list(
    @CurrentActor() actor: ActorContext,
    @Query() query: PurchaseOrderListQueryDto,
  ): Promise<PurchaseOrderListResponse> {
    const result = await this.service.list(actor, query);
    return {
      data: result.items.map(toPurchaseOrderSummary),
      meta: pageMeta(result.page, result.limit, result.total),
    };
  }

  @Post()
  @RequirePermission(PURCHASE_ORDER_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Create a purchase order (draft)', description: 'Requires `purchase_order.manage`.' })
  @ApiBody({ schema: zodToOpenAPI(CreatePurchaseOrderRequestSchema) })
  @ApiCreatedResponse({ schema: PO_SCHEMA })
  async create(
    @CurrentActor() actor: ActorContext,
    @Body() body: CreatePurchaseOrderDto,
  ): Promise<PurchaseOrderResponse> {
    return toPurchaseOrderResponse(await this.service.create(actor, body));
  }

  @Get(':id')
  @RequirePermission(PURCHASE_ORDER_PERMISSIONS.view)
  @ApiOperation({ summary: 'Get a purchase order', description: 'Requires `purchase_order.view`.' })
  @ApiOkResponse({ schema: PO_SCHEMA })
  async get(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<PurchaseOrderResponse> {
    return toPurchaseOrderResponse(await this.service.get(actor, id));
  }

  @Patch(':id')
  @RequirePermission(PURCHASE_ORDER_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Update a draft purchase order', description: 'Requires `purchase_order.manage`.' })
  @ApiBody({ schema: zodToOpenAPI(UpdatePurchaseOrderRequestSchema) })
  @ApiOkResponse({ schema: PO_SCHEMA })
  async update(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body() body: UpdatePurchaseOrderDto,
  ): Promise<PurchaseOrderResponse> {
    return toPurchaseOrderResponse(await this.service.update(actor, id, body));
  }

  @Post(':id/submit')
  @RequirePermission(PURCHASE_ORDER_PERMISSIONS.manage)
  @HttpCode(200)
  @ApiOperation({ summary: 'Submit a purchase order', description: 'Requires `purchase_order.manage`.' })
  @ApiOkResponse({ schema: PO_SCHEMA })
  async submit(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<PurchaseOrderResponse> {
    return toPurchaseOrderResponse(await this.service.submit(actor, id));
  }

  @Post(':id/receive')
  @RequirePermission(PURCHASE_ORDER_PERMISSIONS.manage)
  @HttpCode(200)
  @ApiOperation({
    summary: 'Receive stock against a purchase order',
    description: 'Requires `purchase_order.manage`. Posts `receipt` movements into the given location.',
  })
  @ApiBody({ schema: zodToOpenAPI(ReceivePurchaseOrderRequestSchema) })
  @ApiOkResponse({ schema: PO_SCHEMA })
  async receive(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body() body: ReceivePurchaseOrderDto,
  ): Promise<PurchaseOrderResponse> {
    return toPurchaseOrderResponse(await this.service.receive(actor, id, body));
  }

  @Post(':id/cancel')
  @RequirePermission(PURCHASE_ORDER_PERMISSIONS.manage)
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancel a purchase order', description: 'Requires `purchase_order.manage`.' })
  @ApiOkResponse({ schema: PO_SCHEMA })
  async cancel(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<PurchaseOrderResponse> {
    return toPurchaseOrderResponse(await this.service.cancel(actor, id));
  }
}
