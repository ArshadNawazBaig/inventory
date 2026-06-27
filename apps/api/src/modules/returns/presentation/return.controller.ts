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
  CreateReturnRequestSchema,
  RETURN_KINDS,
  RETURN_PERMISSIONS,
  RETURN_STATUS,
  ReturnListResponseSchema,
  ReturnResponseSchema,
  UpdateReturnRequestSchema,
  type ReturnListResponse,
  type ReturnResponse,
} from '@stockflow/types';
import { type ActorContext, CurrentActor, RequirePermission } from '../../../common';
import { ReturnsService } from '../application/returns.service';
import { CreateReturnDto, ReturnListQueryDto, UpdateReturnDto } from './dto';
import { toReturnResponse, toReturnSummary } from './mappers';

function pageMeta(page: number, limit: number, total: number) {
  return { page: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

const RETURN_SCHEMA = zodToOpenAPI(ReturnResponseSchema);
const RETURN_LIST_SCHEMA = zodToOpenAPI(ReturnListResponseSchema);

@ApiTags('returns')
@Controller({ path: 'returns', version: '1' })
export class ReturnController {
  constructor(private readonly service: ReturnsService) {}

  @Get()
  @RequirePermission(RETURN_PERMISSIONS.view)
  @ApiOperation({ summary: 'List returns', description: 'Requires `return.view`.' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({ name: 'kind', required: false, enum: RETURN_KINDS })
  @ApiQuery({ name: 'status', required: false, enum: RETURN_STATUS })
  @ApiQuery({ name: 'q', required: false })
  @ApiOkResponse({ schema: RETURN_LIST_SCHEMA })
  async list(
    @CurrentActor() actor: ActorContext,
    @Query() query: ReturnListQueryDto,
  ): Promise<ReturnListResponse> {
    const result = await this.service.list(actor, query);
    return {
      data: result.items.map(toReturnSummary),
      meta: pageMeta(result.page, result.limit, result.total),
    };
  }

  @Post()
  @RequirePermission(RETURN_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Create a return (draft)', description: 'Requires `return.manage`.' })
  @ApiBody({ schema: zodToOpenAPI(CreateReturnRequestSchema) })
  @ApiCreatedResponse({ schema: RETURN_SCHEMA })
  async create(
    @CurrentActor() actor: ActorContext,
    @Body() body: CreateReturnDto,
  ): Promise<ReturnResponse> {
    return toReturnResponse(await this.service.create(actor, body));
  }

  @Get(':id')
  @RequirePermission(RETURN_PERMISSIONS.view)
  @ApiOperation({ summary: 'Get a return', description: 'Requires `return.view`.' })
  @ApiOkResponse({ schema: RETURN_SCHEMA })
  async get(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<ReturnResponse> {
    return toReturnResponse(await this.service.get(actor, id));
  }

  @Patch(':id')
  @RequirePermission(RETURN_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Update a draft return', description: 'Requires `return.manage`.' })
  @ApiBody({ schema: zodToOpenAPI(UpdateReturnRequestSchema) })
  @ApiOkResponse({ schema: RETURN_SCHEMA })
  async update(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body() body: UpdateReturnDto,
  ): Promise<ReturnResponse> {
    return toReturnResponse(await this.service.update(actor, id, body));
  }

  @Post(':id/complete')
  @RequirePermission(RETURN_PERMISSIONS.manage)
  @HttpCode(200)
  @ApiOperation({
    summary: 'Complete a return',
    description:
      'Requires `return.manage`. Posts `return_in` (customer) or `return_out` (supplier) movements and locks it.',
  })
  @ApiOkResponse({ schema: RETURN_SCHEMA })
  async complete(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<ReturnResponse> {
    return toReturnResponse(await this.service.complete(actor, id));
  }

  @Post(':id/cancel')
  @RequirePermission(RETURN_PERMISSIONS.manage)
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancel a return', description: 'Requires `return.manage`.' })
  @ApiOkResponse({ schema: RETURN_SCHEMA })
  async cancel(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<ReturnResponse> {
    return toReturnResponse(await this.service.cancel(actor, id));
  }
}
