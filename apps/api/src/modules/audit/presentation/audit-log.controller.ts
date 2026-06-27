import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { zodToOpenAPI } from 'nestjs-zod';
import {
  AUDIT_PERMISSIONS,
  AuditLogListResponseSchema,
  AuditLogResponseSchema,
  type AuditLogListResponse,
  type AuditLogResponse,
} from '@stockflow/types';
import { type ActorContext, CurrentActor, RequirePermission } from '../../../common';
import { AuditService } from '../application/audit.service';
import { AuditLogListQueryDto } from './dto';
import { toAuditLogResponse } from './mappers';

function pageMeta(page: number, limit: number, total: number) {
  return { page: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

const AUDIT_SCHEMA = zodToOpenAPI(AuditLogResponseSchema);
const AUDIT_LIST_SCHEMA = zodToOpenAPI(AuditLogListResponseSchema);

@ApiTags('audit-logs')
@Controller({ path: 'audit-logs', version: '1' })
export class AuditLogController {
  constructor(private readonly service: AuditService) {}

  @Get()
  @RequirePermission(AUDIT_PERMISSIONS.view)
  @ApiOperation({ summary: 'List audit-log entries', description: 'Requires `audit.view`. Read-only, append-only trail.' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'actorId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiOkResponse({ schema: AUDIT_LIST_SCHEMA })
  async list(
    @CurrentActor() actor: ActorContext,
    @Query() query: AuditLogListQueryDto,
  ): Promise<AuditLogListResponse> {
    const result = await this.service.list(actor, query);
    return {
      data: result.items.map(toAuditLogResponse),
      meta: pageMeta(result.page, result.limit, result.total),
    };
  }

  @Get(':id')
  @RequirePermission(AUDIT_PERMISSIONS.view)
  @ApiOperation({ summary: 'Get an audit-log entry', description: 'Requires `audit.view`.' })
  @ApiOkResponse({ schema: AUDIT_SCHEMA })
  async get(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<AuditLogResponse> {
    return toAuditLogResponse(await this.service.get(actor, id));
  }
}
