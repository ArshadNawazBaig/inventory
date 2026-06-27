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
  CreateSalesOrderRequestSchema,
  FulfillSalesOrderRequestSchema,
  SALES_ORDER_PERMISSIONS,
  SALES_ORDER_STATUS,
  SalesOrderListResponseSchema,
  SalesOrderResponseSchema,
  UpdateSalesOrderRequestSchema,
  type SalesOrderListResponse,
  type SalesOrderResponse,
} from '@stockflow/types';
import { type ActorContext, CurrentActor, RequirePermission } from '../../../common';
import { SalesService } from '../application/sales.service';
import {
  CreateSalesOrderDto,
  FulfillSalesOrderDto,
  SalesOrderListQueryDto,
  UpdateSalesOrderDto,
} from './dto';
import { toSalesOrderResponse, toSalesOrderSummary } from './mappers';

function pageMeta(page: number, limit: number, total: number) {
  return { page: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

const SO_SCHEMA = zodToOpenAPI(SalesOrderResponseSchema);
const SO_LIST_SCHEMA = zodToOpenAPI(SalesOrderListResponseSchema);

@ApiTags('sales-orders')
@Controller({ path: 'sales-orders', version: '1' })
export class SalesOrderController {
  constructor(private readonly service: SalesService) {}

  @Get()
  @RequirePermission(SALES_ORDER_PERMISSIONS.view)
  @ApiOperation({ summary: 'List sales orders', description: 'Requires `sales_order.view`.' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({ name: 'status', required: false, enum: SALES_ORDER_STATUS })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'q', required: false })
  @ApiOkResponse({ schema: SO_LIST_SCHEMA })
  async list(
    @CurrentActor() actor: ActorContext,
    @Query() query: SalesOrderListQueryDto,
  ): Promise<SalesOrderListResponse> {
    const result = await this.service.list(actor, query);
    return {
      data: result.items.map(toSalesOrderSummary),
      meta: pageMeta(result.page, result.limit, result.total),
    };
  }

  @Post()
  @RequirePermission(SALES_ORDER_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Create a sales order (draft)', description: 'Requires `sales_order.manage`.' })
  @ApiBody({ schema: zodToOpenAPI(CreateSalesOrderRequestSchema) })
  @ApiCreatedResponse({ schema: SO_SCHEMA })
  async create(
    @CurrentActor() actor: ActorContext,
    @Body() body: CreateSalesOrderDto,
  ): Promise<SalesOrderResponse> {
    return toSalesOrderResponse(await this.service.create(actor, body));
  }

  @Get(':id')
  @RequirePermission(SALES_ORDER_PERMISSIONS.view)
  @ApiOperation({ summary: 'Get a sales order', description: 'Requires `sales_order.view`.' })
  @ApiOkResponse({ schema: SO_SCHEMA })
  async get(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<SalesOrderResponse> {
    return toSalesOrderResponse(await this.service.get(actor, id));
  }

  @Patch(':id')
  @RequirePermission(SALES_ORDER_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Update a draft sales order', description: 'Requires `sales_order.manage`.' })
  @ApiBody({ schema: zodToOpenAPI(UpdateSalesOrderRequestSchema) })
  @ApiOkResponse({ schema: SO_SCHEMA })
  async update(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body() body: UpdateSalesOrderDto,
  ): Promise<SalesOrderResponse> {
    return toSalesOrderResponse(await this.service.update(actor, id, body));
  }

  @Post(':id/confirm')
  @RequirePermission(SALES_ORDER_PERMISSIONS.manage)
  @HttpCode(200)
  @ApiOperation({ summary: 'Confirm a sales order', description: 'Requires `sales_order.manage`.' })
  @ApiOkResponse({ schema: SO_SCHEMA })
  async confirm(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<SalesOrderResponse> {
    return toSalesOrderResponse(await this.service.confirm(actor, id));
  }

  @Post(':id/fulfill')
  @RequirePermission(SALES_ORDER_PERMISSIONS.manage)
  @HttpCode(200)
  @ApiOperation({
    summary: 'Fulfil a sales order',
    description: 'Requires `sales_order.manage`. Posts `shipment` movements out of the given location.',
  })
  @ApiBody({ schema: zodToOpenAPI(FulfillSalesOrderRequestSchema) })
  @ApiOkResponse({ schema: SO_SCHEMA })
  async fulfill(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body() body: FulfillSalesOrderDto,
  ): Promise<SalesOrderResponse> {
    return toSalesOrderResponse(await this.service.fulfill(actor, id, body));
  }

  @Post(':id/cancel')
  @RequirePermission(SALES_ORDER_PERMISSIONS.manage)
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancel a sales order', description: 'Requires `sales_order.manage`.' })
  @ApiOkResponse({ schema: SO_SCHEMA })
  async cancel(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<SalesOrderResponse> {
    return toSalesOrderResponse(await this.service.cancel(actor, id));
  }
}
