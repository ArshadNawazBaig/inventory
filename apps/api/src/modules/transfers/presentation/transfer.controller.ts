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
  CreateTransferRequestSchema,
  ReceiveTransferRequestSchema,
  TRANSFER_PERMISSIONS,
  TRANSFER_STATUS,
  TransferListResponseSchema,
  TransferResponseSchema,
  UpdateTransferRequestSchema,
  type TransferListResponse,
  type TransferResponse,
} from '@stockflow/types';
import { type ActorContext, CurrentActor, RequirePermission } from '../../../common';
import { TransfersService } from '../application/transfers.service';
import {
  CreateTransferDto,
  ReceiveTransferDto,
  TransferListQueryDto,
  UpdateTransferDto,
} from './dto';
import { toTransferResponse, toTransferSummary } from './mappers';

function pageMeta(page: number, limit: number, total: number) {
  return { page: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

const TRANSFER_SCHEMA = zodToOpenAPI(TransferResponseSchema);
const TRANSFER_LIST_SCHEMA = zodToOpenAPI(TransferListResponseSchema);

@ApiTags('transfers')
@Controller({ path: 'transfers', version: '1' })
export class TransferController {
  constructor(private readonly service: TransfersService) {}

  @Get()
  @RequirePermission(TRANSFER_PERMISSIONS.view)
  @ApiOperation({ summary: 'List transfers', description: 'Requires `transfer.view`.' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({ name: 'status', required: false, enum: TRANSFER_STATUS })
  @ApiQuery({ name: 'q', required: false })
  @ApiOkResponse({ schema: TRANSFER_LIST_SCHEMA })
  async list(
    @CurrentActor() actor: ActorContext,
    @Query() query: TransferListQueryDto,
  ): Promise<TransferListResponse> {
    const result = await this.service.list(actor, query);
    return {
      data: result.items.map(toTransferSummary),
      meta: pageMeta(result.page, result.limit, result.total),
    };
  }

  @Post()
  @RequirePermission(TRANSFER_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Create a transfer (draft)', description: 'Requires `transfer.manage`.' })
  @ApiBody({ schema: zodToOpenAPI(CreateTransferRequestSchema) })
  @ApiCreatedResponse({ schema: TRANSFER_SCHEMA })
  async create(
    @CurrentActor() actor: ActorContext,
    @Body() body: CreateTransferDto,
  ): Promise<TransferResponse> {
    return toTransferResponse(await this.service.create(actor, body));
  }

  @Get(':id')
  @RequirePermission(TRANSFER_PERMISSIONS.view)
  @ApiOperation({ summary: 'Get a transfer', description: 'Requires `transfer.view`.' })
  @ApiOkResponse({ schema: TRANSFER_SCHEMA })
  async get(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<TransferResponse> {
    return toTransferResponse(await this.service.get(actor, id));
  }

  @Patch(':id')
  @RequirePermission(TRANSFER_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Update a draft transfer', description: 'Requires `transfer.manage`.' })
  @ApiBody({ schema: zodToOpenAPI(UpdateTransferRequestSchema) })
  @ApiOkResponse({ schema: TRANSFER_SCHEMA })
  async update(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body() body: UpdateTransferDto,
  ): Promise<TransferResponse> {
    return toTransferResponse(await this.service.update(actor, id, body));
  }

  @Post(':id/dispatch')
  @RequirePermission(TRANSFER_PERMISSIONS.manage)
  @HttpCode(200)
  @ApiOperation({
    summary: 'Dispatch a transfer',
    description: 'Requires `transfer.manage`. Posts `transfer_out` movements from the source location.',
  })
  @ApiOkResponse({ schema: TRANSFER_SCHEMA })
  async dispatch(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<TransferResponse> {
    return toTransferResponse(await this.service.dispatch(actor, id));
  }

  @Post(':id/receive')
  @RequirePermission(TRANSFER_PERMISSIONS.manage)
  @HttpCode(200)
  @ApiOperation({
    summary: 'Receive an in-transit transfer',
    description: 'Requires `transfer.manage`. Posts `transfer_in` movements into the destination location.',
  })
  @ApiBody({ schema: zodToOpenAPI(ReceiveTransferRequestSchema) })
  @ApiOkResponse({ schema: TRANSFER_SCHEMA })
  async receive(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body() body: ReceiveTransferDto,
  ): Promise<TransferResponse> {
    return toTransferResponse(await this.service.receive(actor, id, body));
  }

  @Post(':id/cancel')
  @RequirePermission(TRANSFER_PERMISSIONS.manage)
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancel a transfer', description: 'Requires `transfer.manage`.' })
  @ApiOkResponse({ schema: TRANSFER_SCHEMA })
  async cancel(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<TransferResponse> {
    return toTransferResponse(await this.service.cancel(actor, id));
  }
}
