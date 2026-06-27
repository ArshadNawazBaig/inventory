import { Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { zodToOpenAPI } from 'nestjs-zod';
import {
  MarkAllReadResponseSchema,
  NOTIFICATION_PERMISSIONS,
  NOTIFICATION_TYPES,
  NotificationListResponseSchema,
  NotificationResponseSchema,
  UnreadCountResponseSchema,
  type MarkAllReadResponse,
  type NotificationListResponse,
  type NotificationResponse,
  type UnreadCountResponse,
} from '@stockflow/types';
import { type ActorContext, CurrentActor, RequirePermission } from '../../../common';
import { NotificationService } from '../application/notification.service';
import { NotificationListQueryDto } from './dto';
import { toNotificationResponse } from './mappers';

function pageMeta(page: number, limit: number, total: number) {
  return { page: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

const NOTIFICATION_SCHEMA = zodToOpenAPI(NotificationResponseSchema);
const NOTIFICATION_LIST_SCHEMA = zodToOpenAPI(NotificationListResponseSchema);

@ApiTags('notifications')
@Controller({ path: 'notifications', version: '1' })
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  @RequirePermission(NOTIFICATION_PERMISSIONS.view)
  @ApiOperation({ summary: "List the current user's notifications", description: 'Requires `notification.view`. Scoped to the recipient.' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['all', 'unread', 'read'] })
  @ApiQuery({ name: 'type', required: false, enum: NOTIFICATION_TYPES })
  @ApiOkResponse({ schema: NOTIFICATION_LIST_SCHEMA })
  async list(
    @CurrentActor() actor: ActorContext,
    @Query() query: NotificationListQueryDto,
  ): Promise<NotificationListResponse> {
    const result = await this.service.list(actor, query);
    return {
      data: result.items.map(toNotificationResponse),
      meta: pageMeta(result.page, result.limit, result.total),
    };
  }

  @Get('unread-count')
  @RequirePermission(NOTIFICATION_PERMISSIONS.view)
  @ApiOperation({ summary: 'Count unread notifications', description: 'Requires `notification.view`. Powers the navbar bell badge.' })
  @ApiOkResponse({ schema: zodToOpenAPI(UnreadCountResponseSchema) })
  async unreadCount(@CurrentActor() actor: ActorContext): Promise<UnreadCountResponse> {
    return { count: await this.service.unreadCount(actor) };
  }

  @Post(':id/read')
  @RequirePermission(NOTIFICATION_PERMISSIONS.view)
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark a notification read', description: 'Requires `notification.view`. Idempotent.' })
  @ApiOkResponse({ schema: NOTIFICATION_SCHEMA })
  async markRead(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
  ): Promise<NotificationResponse> {
    return toNotificationResponse(await this.service.markRead(actor, id));
  }

  @Post('read-all')
  @RequirePermission(NOTIFICATION_PERMISSIONS.view)
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark all notifications read', description: 'Requires `notification.view`.' })
  @ApiOkResponse({ schema: zodToOpenAPI(MarkAllReadResponseSchema) })
  async markAllRead(@CurrentActor() actor: ActorContext): Promise<MarkAllReadResponse> {
    return { updated: await this.service.markAllRead(actor) };
  }
}
