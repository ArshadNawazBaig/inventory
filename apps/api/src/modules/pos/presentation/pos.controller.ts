import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { zodToOpenAPI } from 'nestjs-zod';
import {
  POS_PERMISSIONS,
  SaleListResponseSchema,
  SaleResponseSchema,
  type SaleListResponse,
  type SaleResponse,
} from '@stockflow/types';
import { type ActorContext, CurrentActor, RequirePermission } from '../../../common';
import { NotFoundError } from '../../../common/errors';
import { PosService } from '../application/pos.service';
import { CreateSaleDto, SaleListQueryDto } from './dto';
import { toSaleResponse } from './mappers';

function pageMeta(page: number, limit: number, total: number) {
  return { page: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

/**
 * Point-of-Sale endpoints. Selling requires `pos.sell`; reading the sales history requires `pos.view`. Every
 * route is tenant-scoped to the actor's organization (the cashier is the session actor).
 */
@ApiTags('pos')
@Controller({ path: 'pos', version: '1' })
export class PosController {
  constructor(private readonly service: PosService) {}

  @Post('sales')
  @RequirePermission(POS_PERMISSIONS.sell)
  @ApiOperation({
    summary: 'Ring up a sale',
    description: 'Requires `pos.sell`. Takes payment, decrements store stock via the ledger, records a receipt.',
  })
  @ApiOkResponse({ schema: zodToOpenAPI(SaleResponseSchema) })
  async create(@CurrentActor() actor: ActorContext, @Body() body: CreateSaleDto): Promise<SaleResponse> {
    return toSaleResponse(await this.service.createSale(actor, body));
  }

  @Get('sales')
  @RequirePermission(POS_PERMISSIONS.view)
  @ApiOperation({ summary: 'List sales', description: 'Requires `pos.view`. The receipt history.' })
  @ApiOkResponse({ schema: zodToOpenAPI(SaleListResponseSchema) })
  async list(
    @CurrentActor() actor: ActorContext,
    @Query() query: SaleListQueryDto,
  ): Promise<SaleListResponse> {
    const { items, total } = await this.service.listSales(actor, query);
    return { data: items.map(toSaleResponse), meta: pageMeta(query.page, query.limit, total) };
  }

  @Get('sales/:id')
  @RequirePermission(POS_PERMISSIONS.view)
  @ApiOperation({ summary: 'Get a sale', description: 'Requires `pos.view`. A single receipt.' })
  @ApiOkResponse({ schema: zodToOpenAPI(SaleResponseSchema) })
  async get(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<SaleResponse> {
    const sale = await this.service.getSale(actor, id);
    if (!sale) throw new NotFoundError('Sale not found.');
    return toSaleResponse(sale);
  }
}
