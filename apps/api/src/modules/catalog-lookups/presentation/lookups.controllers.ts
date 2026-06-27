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
  BRAND_PERMISSIONS,
  BrandListResponseSchema,
  BrandResponseSchema,
  CATEGORY_PERMISSIONS,
  CategoryListResponseSchema,
  CategoryResponseSchema,
  CreateBrandRequestSchema,
  CreateCategoryRequestSchema,
  CreateUnitRequestSchema,
  UNIT_PERMISSIONS,
  UnitListResponseSchema,
  UnitResponseSchema,
  UpdateBrandRequestSchema,
  UpdateCategoryRequestSchema,
  UpdateUnitRequestSchema,
  type BrandListResponse,
  type BrandResponse,
  type CategoryListResponse,
  type CategoryResponse,
  type UnitListResponse,
  type UnitResponse,
} from '@stockflow/types';
import { type ActorContext, CurrentActor, RequirePermission } from '../../../common';
import { BrandService, CategoryService, UnitService } from '../application/lookup.service';
import {
  CreateBrandDto,
  CreateCategoryDto,
  CreateUnitDto,
  LookupListQueryDto,
  UpdateBrandDto,
  UpdateCategoryDto,
  UpdateUnitDto,
} from './dto';
import { toBrandResponse, toCategoryResponse, toUnitResponse } from './mappers';

function pageMeta(page: number, limit: number, total: number) {
  return { page: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

function applyListQueryDocs(): MethodDecorator {
  // Compose the shared list query params into one decorator (page/limit/sort/status/q).
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

const CATEGORY_SCHEMA = zodToOpenAPI(CategoryResponseSchema);
const CATEGORY_LIST_SCHEMA = zodToOpenAPI(CategoryListResponseSchema);
const BRAND_SCHEMA = zodToOpenAPI(BrandResponseSchema);
const BRAND_LIST_SCHEMA = zodToOpenAPI(BrandListResponseSchema);
const UNIT_SCHEMA = zodToOpenAPI(UnitResponseSchema);
const UNIT_LIST_SCHEMA = zodToOpenAPI(UnitListResponseSchema);

// ─── Categories ─────────────────────────────────────────────────────────────
@ApiTags('categories')
@Controller({ path: 'categories', version: '1' })
export class CategoryController {
  constructor(private readonly service: CategoryService) {}

  @Get()
  @RequirePermission(CATEGORY_PERMISSIONS.view)
  @ApiOperation({ summary: 'List categories', description: 'Requires `category.view`.' })
  @applyListQueryDocs()
  @ApiOkResponse({ schema: CATEGORY_LIST_SCHEMA })
  async list(
    @CurrentActor() actor: ActorContext,
    @Query() query: LookupListQueryDto,
  ): Promise<CategoryListResponse> {
    const result = await this.service.list(actor, query);
    return { data: result.items.map(toCategoryResponse), meta: pageMeta(result.page, result.limit, result.total) };
  }

  @Post()
  @RequirePermission(CATEGORY_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Create a category', description: 'Requires `category.manage`.' })
  @ApiBody({ schema: zodToOpenAPI(CreateCategoryRequestSchema) })
  @ApiCreatedResponse({ schema: CATEGORY_SCHEMA })
  async create(
    @CurrentActor() actor: ActorContext,
    @Body() body: CreateCategoryDto,
  ): Promise<CategoryResponse> {
    return toCategoryResponse(await this.service.create(actor, body));
  }

  @Get(':id')
  @RequirePermission(CATEGORY_PERMISSIONS.view)
  @ApiOperation({ summary: 'Get a category', description: 'Requires `category.view`.' })
  @ApiOkResponse({ schema: CATEGORY_SCHEMA })
  async get(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<CategoryResponse> {
    return toCategoryResponse(await this.service.get(actor, id));
  }

  @Patch(':id')
  @RequirePermission(CATEGORY_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Update a category', description: 'Requires `category.manage`.' })
  @ApiBody({ schema: zodToOpenAPI(UpdateCategoryRequestSchema) })
  @ApiOkResponse({ schema: CATEGORY_SCHEMA })
  async update(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body() body: UpdateCategoryDto,
  ): Promise<CategoryResponse> {
    return toCategoryResponse(await this.service.update(actor, id, body));
  }

  @Delete(':id')
  @RequirePermission(CATEGORY_PERMISSIONS.manage)
  @HttpCode(204)
  @ApiOperation({ summary: 'Soft-delete a category', description: 'Requires `category.manage`.' })
  @ApiNoContentResponse()
  async remove(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<void> {
    await this.service.remove(actor, id);
  }

  @Post(':id/archive')
  @RequirePermission(CATEGORY_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Archive a category', description: 'Requires `category.manage`.' })
  @ApiOkResponse({ schema: CATEGORY_SCHEMA })
  async archive(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<CategoryResponse> {
    return toCategoryResponse(await this.service.archive(actor, id));
  }

  @Post(':id/restore')
  @RequirePermission(CATEGORY_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Restore a category', description: 'Requires `category.manage`.' })
  @ApiOkResponse({ schema: CATEGORY_SCHEMA })
  async restore(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<CategoryResponse> {
    return toCategoryResponse(await this.service.restore(actor, id));
  }
}

// ─── Brands ───────────────────────────────────────────────────────────────────
@ApiTags('brands')
@Controller({ path: 'brands', version: '1' })
export class BrandController {
  constructor(private readonly service: BrandService) {}

  @Get()
  @RequirePermission(BRAND_PERMISSIONS.view)
  @ApiOperation({ summary: 'List brands', description: 'Requires `brand.view`.' })
  @applyListQueryDocs()
  @ApiOkResponse({ schema: BRAND_LIST_SCHEMA })
  async list(
    @CurrentActor() actor: ActorContext,
    @Query() query: LookupListQueryDto,
  ): Promise<BrandListResponse> {
    const result = await this.service.list(actor, query);
    return { data: result.items.map(toBrandResponse), meta: pageMeta(result.page, result.limit, result.total) };
  }

  @Post()
  @RequirePermission(BRAND_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Create a brand', description: 'Requires `brand.manage`.' })
  @ApiBody({ schema: zodToOpenAPI(CreateBrandRequestSchema) })
  @ApiCreatedResponse({ schema: BRAND_SCHEMA })
  async create(@CurrentActor() actor: ActorContext, @Body() body: CreateBrandDto): Promise<BrandResponse> {
    return toBrandResponse(await this.service.create(actor, body));
  }

  @Get(':id')
  @RequirePermission(BRAND_PERMISSIONS.view)
  @ApiOperation({ summary: 'Get a brand', description: 'Requires `brand.view`.' })
  @ApiOkResponse({ schema: BRAND_SCHEMA })
  async get(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<BrandResponse> {
    return toBrandResponse(await this.service.get(actor, id));
  }

  @Patch(':id')
  @RequirePermission(BRAND_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Update a brand', description: 'Requires `brand.manage`.' })
  @ApiBody({ schema: zodToOpenAPI(UpdateBrandRequestSchema) })
  @ApiOkResponse({ schema: BRAND_SCHEMA })
  async update(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body() body: UpdateBrandDto,
  ): Promise<BrandResponse> {
    return toBrandResponse(await this.service.update(actor, id, body));
  }

  @Delete(':id')
  @RequirePermission(BRAND_PERMISSIONS.manage)
  @HttpCode(204)
  @ApiOperation({ summary: 'Soft-delete a brand', description: 'Requires `brand.manage`.' })
  @ApiNoContentResponse()
  async remove(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<void> {
    await this.service.remove(actor, id);
  }

  @Post(':id/archive')
  @RequirePermission(BRAND_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Archive a brand', description: 'Requires `brand.manage`.' })
  @ApiOkResponse({ schema: BRAND_SCHEMA })
  async archive(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<BrandResponse> {
    return toBrandResponse(await this.service.archive(actor, id));
  }

  @Post(':id/restore')
  @RequirePermission(BRAND_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Restore a brand', description: 'Requires `brand.manage`.' })
  @ApiOkResponse({ schema: BRAND_SCHEMA })
  async restore(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<BrandResponse> {
    return toBrandResponse(await this.service.restore(actor, id));
  }
}

// ─── Units ────────────────────────────────────────────────────────────────────
@ApiTags('units')
@Controller({ path: 'units', version: '1' })
export class UnitController {
  constructor(private readonly service: UnitService) {}

  @Get()
  @RequirePermission(UNIT_PERMISSIONS.view)
  @ApiOperation({ summary: 'List units', description: 'Requires `unit.view`.' })
  @applyListQueryDocs()
  @ApiOkResponse({ schema: UNIT_LIST_SCHEMA })
  async list(
    @CurrentActor() actor: ActorContext,
    @Query() query: LookupListQueryDto,
  ): Promise<UnitListResponse> {
    const result = await this.service.list(actor, query);
    return { data: result.items.map(toUnitResponse), meta: pageMeta(result.page, result.limit, result.total) };
  }

  @Post()
  @RequirePermission(UNIT_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Create a unit', description: 'Requires `unit.manage`.' })
  @ApiBody({ schema: zodToOpenAPI(CreateUnitRequestSchema) })
  @ApiCreatedResponse({ schema: UNIT_SCHEMA })
  async create(@CurrentActor() actor: ActorContext, @Body() body: CreateUnitDto): Promise<UnitResponse> {
    return toUnitResponse(await this.service.create(actor, body));
  }

  @Get(':id')
  @RequirePermission(UNIT_PERMISSIONS.view)
  @ApiOperation({ summary: 'Get a unit', description: 'Requires `unit.view`.' })
  @ApiOkResponse({ schema: UNIT_SCHEMA })
  async get(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<UnitResponse> {
    return toUnitResponse(await this.service.get(actor, id));
  }

  @Patch(':id')
  @RequirePermission(UNIT_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Update a unit', description: 'Requires `unit.manage`.' })
  @ApiBody({ schema: zodToOpenAPI(UpdateUnitRequestSchema) })
  @ApiOkResponse({ schema: UNIT_SCHEMA })
  async update(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body() body: UpdateUnitDto,
  ): Promise<UnitResponse> {
    return toUnitResponse(await this.service.update(actor, id, body));
  }

  @Delete(':id')
  @RequirePermission(UNIT_PERMISSIONS.manage)
  @HttpCode(204)
  @ApiOperation({ summary: 'Soft-delete a unit', description: 'Requires `unit.manage`.' })
  @ApiNoContentResponse()
  async remove(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<void> {
    await this.service.remove(actor, id);
  }

  @Post(':id/archive')
  @RequirePermission(UNIT_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Archive a unit', description: 'Requires `unit.manage`.' })
  @ApiOkResponse({ schema: UNIT_SCHEMA })
  async archive(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<UnitResponse> {
    return toUnitResponse(await this.service.archive(actor, id));
  }

  @Post(':id/restore')
  @RequirePermission(UNIT_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Restore a unit', description: 'Requires `unit.manage`.' })
  @ApiOkResponse({ schema: UNIT_SCHEMA })
  async restore(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<UnitResponse> {
    return toUnitResponse(await this.service.restore(actor, id));
  }
}
