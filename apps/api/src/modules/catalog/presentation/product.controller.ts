import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
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
  CATALOG_PERMISSIONS,
  CreateProductRequestSchema,
  CreateVariantRequestSchema,
  type ProductListResponse,
  ProductListResponseSchema,
  type ProductResponse,
  ProductResponseSchema,
  UpdateProductRequestSchema,
  UpdateVariantRequestSchema,
  type VariantResponse,
  VariantResponseSchema,
} from '@stockflow/types';
import { type ActorContext, CurrentActor, RequirePermission } from '../../../common';
import { ProductService } from '../application/product.service';
import {
  CreateProductDto,
  CreateVariantDto,
  ListProductsQueryDto,
  UpdateProductDto,
  UpdateVariantDto,
} from './product.dto';
import { toProductResponse, toVariantResponse } from './product.mapper';

// OpenAPI schemas derived once from the shared Zod contracts (single source of truth).
const PRODUCT_SCHEMA = zodToOpenAPI(ProductResponseSchema);
const PRODUCT_LIST_SCHEMA = zodToOpenAPI(ProductListResponseSchema);
const VARIANT_SCHEMA = zodToOpenAPI(VariantResponseSchema);
const VARIANT_LIST_SCHEMA = { type: 'array' as const, items: VARIANT_SCHEMA };
const CREATE_PRODUCT_BODY = zodToOpenAPI(CreateProductRequestSchema);
const UPDATE_PRODUCT_BODY = zodToOpenAPI(UpdateProductRequestSchema);
const CREATE_VARIANT_BODY = zodToOpenAPI(CreateVariantRequestSchema);
const UPDATE_VARIANT_BODY = zodToOpenAPI(UpdateVariantRequestSchema);

@ApiTags('products')
@Controller({ path: 'products', version: '1' })
export class ProductController {
  constructor(private readonly products: ProductService) {}

  @Get()
  @RequirePermission(CATALOG_PERMISSIONS.view)
  @ApiOperation({ summary: 'List products', description: 'Requires `product.view`.' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['draft', 'active', 'archived'] })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'brandId', required: false })
  @ApiQuery({ name: 'q', required: false })
  @ApiOkResponse({ schema: PRODUCT_LIST_SCHEMA })
  async list(
    @CurrentActor() actor: ActorContext,
    @Query() query: ListProductsQueryDto,
  ): Promise<ProductListResponse> {
    const result = await this.products.listProducts(actor, query);
    return {
      data: result.items.map((item) =>
        toProductResponse(item, { variantCount: item.variantCount }),
      ),
      meta: {
        page: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
        },
      },
    };
  }

  @Post()
  @RequirePermission(CATALOG_PERMISSIONS.create)
  @ApiOperation({
    summary: 'Create a product with its initial variant(s)',
    description: 'Requires `product.create`.',
  })
  @ApiBody({ schema: CREATE_PRODUCT_BODY })
  @ApiCreatedResponse({ schema: PRODUCT_SCHEMA })
  async create(
    @CurrentActor() actor: ActorContext,
    @Body() body: CreateProductDto,
  ): Promise<ProductResponse> {
    const product = await this.products.createProduct(actor, body);
    return toProductResponse(product, { variants: product.variants });
  }

  @Get(':productId')
  @RequirePermission(CATALOG_PERMISSIONS.view)
  @ApiOperation({ summary: 'Get a product with its variants', description: 'Requires `product.view`.' })
  @ApiOkResponse({ schema: PRODUCT_SCHEMA })
  async get(
    @CurrentActor() actor: ActorContext,
    @Param('productId') productId: string,
  ): Promise<ProductResponse> {
    const product = await this.products.getProduct(actor, productId);
    return toProductResponse(product, { variants: product.variants });
  }

  @Patch(':productId')
  @RequirePermission(CATALOG_PERMISSIONS.update)
  @ApiOperation({ summary: 'Update a product', description: 'Requires `product.update`.' })
  @ApiBody({ schema: UPDATE_PRODUCT_BODY })
  @ApiOkResponse({ schema: PRODUCT_SCHEMA })
  async update(
    @CurrentActor() actor: ActorContext,
    @Param('productId') productId: string,
    @Body() body: UpdateProductDto,
  ): Promise<ProductResponse> {
    await this.products.updateProduct(actor, productId, body);
    const product = await this.products.getProduct(actor, productId);
    return toProductResponse(product, { variants: product.variants });
  }

  @Delete(':productId')
  @RequirePermission(CATALOG_PERMISSIONS.delete)
  @HttpCode(204)
  @ApiOperation({
    summary: 'Soft-delete a product',
    description: 'Requires `product.delete`. Blocked if a variant has stock or open orders.',
  })
  @ApiNoContentResponse()
  async remove(
    @CurrentActor() actor: ActorContext,
    @Param('productId') productId: string,
  ): Promise<void> {
    await this.products.deleteProduct(actor, productId);
  }

  @Post(':productId/archive')
  @RequirePermission(CATALOG_PERMISSIONS.update)
  @ApiOperation({ summary: 'Archive a product', description: 'Requires `product.update`.' })
  @ApiOkResponse({ schema: PRODUCT_SCHEMA })
  async archive(
    @CurrentActor() actor: ActorContext,
    @Param('productId') productId: string,
  ): Promise<ProductResponse> {
    await this.products.archiveProduct(actor, productId);
    const product = await this.products.getProduct(actor, productId);
    return toProductResponse(product, { variants: product.variants });
  }

  @Post(':productId/restore')
  @RequirePermission(CATALOG_PERMISSIONS.update)
  @ApiOperation({
    summary: 'Restore an archived or deleted product',
    description: 'Requires `product.update`.',
  })
  @ApiOkResponse({ schema: PRODUCT_SCHEMA })
  async restore(
    @CurrentActor() actor: ActorContext,
    @Param('productId') productId: string,
  ): Promise<ProductResponse> {
    const product = await this.products.restoreProduct(actor, productId);
    const variants = await this.products.listVariants(actor, product.id);
    return toProductResponse(product, { variants });
  }

  // ─── Variants ────────────────────────────────────────────────────────────
  @Get(':productId/variants')
  @RequirePermission(CATALOG_PERMISSIONS.view)
  @ApiOperation({ summary: 'List a product’s variants', description: 'Requires `product.view`.' })
  @ApiOkResponse({ schema: VARIANT_LIST_SCHEMA })
  async listVariants(
    @CurrentActor() actor: ActorContext,
    @Param('productId') productId: string,
  ): Promise<VariantResponse[]> {
    const variants = await this.products.listVariants(actor, productId);
    return variants.map(toVariantResponse);
  }

  @Post(':productId/variants')
  @RequirePermission(CATALOG_PERMISSIONS.update)
  @HttpCode(201)
  @ApiOperation({ summary: 'Add a variant to a product', description: 'Requires `product.update`.' })
  @ApiBody({ schema: CREATE_VARIANT_BODY })
  @ApiCreatedResponse({ schema: VARIANT_SCHEMA })
  async addVariant(
    @CurrentActor() actor: ActorContext,
    @Param('productId') productId: string,
    @Body() body: CreateVariantDto,
  ): Promise<VariantResponse> {
    const variant = await this.products.addVariant(actor, productId, body);
    return toVariantResponse(variant);
  }

  @Get(':productId/variants/:variantId')
  @RequirePermission(CATALOG_PERMISSIONS.view)
  @ApiOperation({ summary: 'Get a variant', description: 'Requires `product.view`.' })
  @ApiOkResponse({ schema: VARIANT_SCHEMA })
  async getVariant(
    @CurrentActor() actor: ActorContext,
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
  ): Promise<VariantResponse> {
    return toVariantResponse(await this.products.getVariant(actor, productId, variantId));
  }

  @Patch(':productId/variants/:variantId')
  @RequirePermission(CATALOG_PERMISSIONS.update)
  @ApiOperation({ summary: 'Update a variant', description: 'Requires `product.update`.' })
  @ApiBody({ schema: UPDATE_VARIANT_BODY })
  @ApiOkResponse({ schema: VARIANT_SCHEMA })
  async updateVariant(
    @CurrentActor() actor: ActorContext,
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
    @Body() body: UpdateVariantDto,
  ): Promise<VariantResponse> {
    return toVariantResponse(await this.products.updateVariant(actor, productId, variantId, body));
  }

  @Delete(':productId/variants/:variantId')
  @RequirePermission(CATALOG_PERMISSIONS.update)
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete a variant',
    description: 'Requires `product.update`. Blocked for the last variant or one with stock.',
  })
  @ApiNoContentResponse()
  async removeVariant(
    @CurrentActor() actor: ActorContext,
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
  ): Promise<void> {
    await this.products.deleteVariant(actor, productId, variantId);
  }
}
