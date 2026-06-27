import { createZodDto } from 'nestjs-zod';
import {
  CreateProductRequestSchema,
  CreateVariantRequestSchema,
  ListProductsQuerySchema,
  ProductListResponseSchema,
  ProductResponseSchema,
  UpdateProductRequestSchema,
  UpdateVariantRequestSchema,
  VariantResponseSchema,
} from '@stockflow/types';

/**
 * NestJS DTO classes derived from the shared Zod contracts. One source of truth →
 * runtime validation (global ZodValidationPipe) AND OpenAPI schema (patchNestJsSwagger).
 */
export class CreateProductDto extends createZodDto(CreateProductRequestSchema) {}
export class UpdateProductDto extends createZodDto(UpdateProductRequestSchema) {}
export class CreateVariantDto extends createZodDto(CreateVariantRequestSchema) {}
export class UpdateVariantDto extends createZodDto(UpdateVariantRequestSchema) {}
export class ListProductsQueryDto extends createZodDto(ListProductsQuerySchema) {}
export class ProductResponseDto extends createZodDto(ProductResponseSchema) {}
export class ProductListResponseDto extends createZodDto(ProductListResponseSchema) {}
export class VariantResponseDto extends createZodDto(VariantResponseSchema) {}
