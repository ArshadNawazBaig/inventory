import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { zodToOpenAPI } from 'nestjs-zod';
import {
  CreateLocationRequestSchema,
  CreateWarehouseRequestSchema,
  LOCATION_PERMISSIONS,
  LOCATION_TYPES,
  LocationListResponseSchema,
  LocationResponseSchema,
  UpdateLocationRequestSchema,
  UpdateWarehouseRequestSchema,
  WAREHOUSE_PERMISSIONS,
  WarehouseListResponseSchema,
  WarehouseResponseSchema,
  type LocationListResponse,
  type LocationResponse,
  type WarehouseListResponse,
  type WarehouseResponse,
} from '@stockflow/types';
import { type ActorContext, CurrentActor, RequirePermission } from '../../../common';
import { LocationService } from '../application/location.service';
import { WarehouseService } from '../application/warehouse.service';
import {
  CreateLocationDto,
  CreateWarehouseDto,
  LocationListQueryDto,
  UpdateLocationDto,
  UpdateWarehouseDto,
  WarehouseListQueryDto,
} from './dto';
import { toLocationResponse, toWarehouseResponse } from './mappers';

function pageMeta(page: number, limit: number, total: number) {
  return { page: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

function applyListQueryDocs(): MethodDecorator {
  const decorators = [
    ApiQuery({ name: 'page', required: false, type: Number }),
    ApiQuery({ name: 'limit', required: false, type: Number }),
    ApiQuery({ name: 'sort', required: false }),
    ApiQuery({ name: 'status', required: false, enum: ['active', 'archived'] }),
    ApiQuery({ name: 'q', required: false }),
  ];
  return (target, key, descriptor) => {
    for (const decorate of decorators) decorate(target, key, descriptor);
  };
}

function applyLocationListQueryDocs(): MethodDecorator {
  const decorators = [
    ApiQuery({ name: 'page', required: false, type: Number }),
    ApiQuery({ name: 'limit', required: false, type: Number }),
    ApiQuery({ name: 'sort', required: false }),
    ApiQuery({ name: 'status', required: false, enum: ['active', 'archived'] }),
    ApiQuery({ name: 'q', required: false }),
    ApiQuery({ name: 'warehouseId', required: false }),
    ApiQuery({ name: 'parentLocationId', required: false }),
    ApiQuery({ name: 'type', required: false, enum: LOCATION_TYPES }),
  ];
  return (target, key, descriptor) => {
    for (const decorate of decorators) decorate(target, key, descriptor);
  };
}

const WAREHOUSE_SCHEMA = zodToOpenAPI(WarehouseResponseSchema);
const WAREHOUSE_LIST_SCHEMA = zodToOpenAPI(WarehouseListResponseSchema);
const LOCATION_SCHEMA = zodToOpenAPI(LocationResponseSchema);
const LOCATION_LIST_SCHEMA = zodToOpenAPI(LocationListResponseSchema);

// ─── Warehouses ───────────────────────────────────────────────────────────────
@ApiTags('warehouses')
@Controller({ path: 'warehouses', version: '1' })
export class WarehouseController {
  constructor(private readonly service: WarehouseService) {}

  @Get()
  @RequirePermission(WAREHOUSE_PERMISSIONS.view)
  @ApiOperation({ summary: 'List warehouses', description: 'Requires `warehouse.view`.' })
  @applyListQueryDocs()
  @ApiOkResponse({ schema: WAREHOUSE_LIST_SCHEMA })
  async list(
    @CurrentActor() actor: ActorContext,
    @Query() query: WarehouseListQueryDto,
  ): Promise<WarehouseListResponse> {
    const result = await this.service.list(actor, query);
    return {
      data: result.items.map(toWarehouseResponse),
      meta: pageMeta(result.page, result.limit, result.total),
    };
  }

  @Post()
  @RequirePermission(WAREHOUSE_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Create a warehouse', description: 'Requires `warehouse.manage`.' })
  @ApiBody({ schema: zodToOpenAPI(CreateWarehouseRequestSchema) })
  @ApiCreatedResponse({ schema: WAREHOUSE_SCHEMA })
  async create(
    @CurrentActor() actor: ActorContext,
    @Body() body: CreateWarehouseDto,
  ): Promise<WarehouseResponse> {
    return toWarehouseResponse(await this.service.create(actor, body));
  }

  @Get(':id')
  @RequirePermission(WAREHOUSE_PERMISSIONS.view)
  @ApiOperation({ summary: 'Get a warehouse', description: 'Requires `warehouse.view`.' })
  @ApiOkResponse({ schema: WAREHOUSE_SCHEMA })
  async get(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<WarehouseResponse> {
    return toWarehouseResponse(await this.service.get(actor, id));
  }

  @Patch(':id')
  @RequirePermission(WAREHOUSE_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Update a warehouse', description: 'Requires `warehouse.manage`.' })
  @ApiBody({ schema: zodToOpenAPI(UpdateWarehouseRequestSchema) })
  @ApiOkResponse({ schema: WAREHOUSE_SCHEMA })
  async update(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body() body: UpdateWarehouseDto,
  ): Promise<WarehouseResponse> {
    return toWarehouseResponse(await this.service.update(actor, id, body));
  }

  @Delete(':id')
  @RequirePermission(WAREHOUSE_PERMISSIONS.manage)
  @HttpCode(204)
  @ApiOperation({ summary: 'Soft-delete a warehouse', description: 'Requires `warehouse.manage`.' })
  @ApiNoContentResponse()
  async remove(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<void> {
    await this.service.remove(actor, id);
  }

  @Post(':id/archive')
  @RequirePermission(WAREHOUSE_PERMISSIONS.manage)
  @HttpCode(200)
  @ApiOperation({ summary: 'Archive a warehouse', description: 'Requires `warehouse.manage`.' })
  @ApiOkResponse({ schema: WAREHOUSE_SCHEMA })
  async archive(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<WarehouseResponse> {
    return toWarehouseResponse(await this.service.archive(actor, id));
  }

  @Post(':id/restore')
  @RequirePermission(WAREHOUSE_PERMISSIONS.manage)
  @HttpCode(200)
  @ApiOperation({ summary: 'Restore a warehouse', description: 'Requires `warehouse.manage`.' })
  @ApiOkResponse({ schema: WAREHOUSE_SCHEMA })
  async restore(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<WarehouseResponse> {
    return toWarehouseResponse(await this.service.restore(actor, id));
  }
}

// ─── Locations ──────────────────────────────────────────────────────────────────
@ApiTags('locations')
@Controller({ path: 'locations', version: '1' })
export class LocationController {
  constructor(private readonly service: LocationService) {}

  @Get()
  @RequirePermission(LOCATION_PERMISSIONS.view)
  @ApiOperation({
    summary: 'List locations',
    description: 'Requires `location.view`. Filter by `warehouseId` to scope to one warehouse.',
  })
  @applyLocationListQueryDocs()
  @ApiOkResponse({ schema: LOCATION_LIST_SCHEMA })
  async list(
    @CurrentActor() actor: ActorContext,
    @Query() query: LocationListQueryDto,
  ): Promise<LocationListResponse> {
    const result = await this.service.list(actor, query);
    return {
      data: result.items.map(toLocationResponse),
      meta: pageMeta(result.page, result.limit, result.total),
    };
  }

  @Post()
  @RequirePermission(LOCATION_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Create a location', description: 'Requires `location.manage`.' })
  @ApiBody({ schema: zodToOpenAPI(CreateLocationRequestSchema) })
  @ApiCreatedResponse({ schema: LOCATION_SCHEMA })
  async create(
    @CurrentActor() actor: ActorContext,
    @Body() body: CreateLocationDto,
  ): Promise<LocationResponse> {
    return toLocationResponse(await this.service.create(actor, body));
  }

  @Get(':id')
  @RequirePermission(LOCATION_PERMISSIONS.view)
  @ApiOperation({ summary: 'Get a location', description: 'Requires `location.view`.' })
  @ApiOkResponse({ schema: LOCATION_SCHEMA })
  async get(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<LocationResponse> {
    return toLocationResponse(await this.service.get(actor, id));
  }

  @Patch(':id')
  @RequirePermission(LOCATION_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Update a location', description: 'Requires `location.manage`.' })
  @ApiBody({ schema: zodToOpenAPI(UpdateLocationRequestSchema) })
  @ApiOkResponse({ schema: LOCATION_SCHEMA })
  async update(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body() body: UpdateLocationDto,
  ): Promise<LocationResponse> {
    return toLocationResponse(await this.service.update(actor, id, body));
  }

  @Delete(':id')
  @RequirePermission(LOCATION_PERMISSIONS.manage)
  @HttpCode(204)
  @ApiOperation({
    summary: 'Soft-delete a location',
    description: 'Requires `location.manage`. Fails if the location still has child locations.',
  })
  @ApiNoContentResponse()
  async remove(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<void> {
    await this.service.remove(actor, id);
  }

  @Post(':id/archive')
  @RequirePermission(LOCATION_PERMISSIONS.manage)
  @HttpCode(200)
  @ApiOperation({ summary: 'Archive a location', description: 'Requires `location.manage`.' })
  @ApiOkResponse({ schema: LOCATION_SCHEMA })
  async archive(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<LocationResponse> {
    return toLocationResponse(await this.service.archive(actor, id));
  }

  @Post(':id/restore')
  @RequirePermission(LOCATION_PERMISSIONS.manage)
  @HttpCode(200)
  @ApiOperation({ summary: 'Restore a location', description: 'Requires `location.manage`.' })
  @ApiOkResponse({ schema: LOCATION_SCHEMA })
  async restore(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<LocationResponse> {
    return toLocationResponse(await this.service.restore(actor, id));
  }
}
