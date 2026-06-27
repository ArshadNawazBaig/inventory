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
  CUSTOMER_PERMISSIONS,
  CreateCustomerRequestSchema,
  CreateSupplierRequestSchema,
  CustomerListResponseSchema,
  CustomerResponseSchema,
  SUPPLIER_PERMISSIONS,
  SupplierListResponseSchema,
  SupplierResponseSchema,
  UpdateCustomerRequestSchema,
  UpdateSupplierRequestSchema,
  type CustomerListResponse,
  type CustomerResponse,
  type SupplierListResponse,
  type SupplierResponse,
} from '@stockflow/types';
import { type ActorContext, CurrentActor, RequirePermission } from '../../../common';
import { CustomerService, SupplierService } from '../application/party.service';
import {
  CreateCustomerDto,
  CreateSupplierDto,
  PartyListQueryDto,
  UpdateCustomerDto,
  UpdateSupplierDto,
} from './dto';
import { toCustomerResponse, toSupplierResponse } from './mappers';

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

const SUPPLIER_SCHEMA = zodToOpenAPI(SupplierResponseSchema);
const SUPPLIER_LIST_SCHEMA = zodToOpenAPI(SupplierListResponseSchema);
const CUSTOMER_SCHEMA = zodToOpenAPI(CustomerResponseSchema);
const CUSTOMER_LIST_SCHEMA = zodToOpenAPI(CustomerListResponseSchema);

// ─── Suppliers ────────────────────────────────────────────────────────────────
@ApiTags('suppliers')
@Controller({ path: 'suppliers', version: '1' })
export class SupplierController {
  constructor(private readonly service: SupplierService) {}

  @Get()
  @RequirePermission(SUPPLIER_PERMISSIONS.view)
  @ApiOperation({ summary: 'List suppliers', description: 'Requires `supplier.view`.' })
  @applyListQueryDocs()
  @ApiOkResponse({ schema: SUPPLIER_LIST_SCHEMA })
  async list(
    @CurrentActor() actor: ActorContext,
    @Query() query: PartyListQueryDto,
  ): Promise<SupplierListResponse> {
    const result = await this.service.list(actor, query);
    return { data: result.items.map(toSupplierResponse), meta: pageMeta(result.page, result.limit, result.total) };
  }

  @Post()
  @RequirePermission(SUPPLIER_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Create a supplier', description: 'Requires `supplier.manage`.' })
  @ApiBody({ schema: zodToOpenAPI(CreateSupplierRequestSchema) })
  @ApiCreatedResponse({ schema: SUPPLIER_SCHEMA })
  async create(@CurrentActor() actor: ActorContext, @Body() body: CreateSupplierDto): Promise<SupplierResponse> {
    return toSupplierResponse(await this.service.create(actor, body));
  }

  @Get(':id')
  @RequirePermission(SUPPLIER_PERMISSIONS.view)
  @ApiOperation({ summary: 'Get a supplier', description: 'Requires `supplier.view`.' })
  @ApiOkResponse({ schema: SUPPLIER_SCHEMA })
  async get(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<SupplierResponse> {
    return toSupplierResponse(await this.service.get(actor, id));
  }

  @Patch(':id')
  @RequirePermission(SUPPLIER_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Update a supplier', description: 'Requires `supplier.manage`.' })
  @ApiBody({ schema: zodToOpenAPI(UpdateSupplierRequestSchema) })
  @ApiOkResponse({ schema: SUPPLIER_SCHEMA })
  async update(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body() body: UpdateSupplierDto,
  ): Promise<SupplierResponse> {
    return toSupplierResponse(await this.service.update(actor, id, body));
  }

  @Delete(':id')
  @RequirePermission(SUPPLIER_PERMISSIONS.manage)
  @HttpCode(204)
  @ApiOperation({ summary: 'Soft-delete a supplier', description: 'Requires `supplier.manage`.' })
  @ApiNoContentResponse()
  async remove(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<void> {
    await this.service.remove(actor, id);
  }

  @Post(':id/archive')
  @RequirePermission(SUPPLIER_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Archive a supplier', description: 'Requires `supplier.manage`.' })
  @ApiOkResponse({ schema: SUPPLIER_SCHEMA })
  async archive(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<SupplierResponse> {
    return toSupplierResponse(await this.service.archive(actor, id));
  }

  @Post(':id/restore')
  @RequirePermission(SUPPLIER_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Restore a supplier', description: 'Requires `supplier.manage`.' })
  @ApiOkResponse({ schema: SUPPLIER_SCHEMA })
  async restore(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<SupplierResponse> {
    return toSupplierResponse(await this.service.restore(actor, id));
  }
}

// ─── Customers ──────────────────────────────────────────────────────────────────
@ApiTags('customers')
@Controller({ path: 'customers', version: '1' })
export class CustomerController {
  constructor(private readonly service: CustomerService) {}

  @Get()
  @RequirePermission(CUSTOMER_PERMISSIONS.view)
  @ApiOperation({ summary: 'List customers', description: 'Requires `customer.view`.' })
  @applyListQueryDocs()
  @ApiOkResponse({ schema: CUSTOMER_LIST_SCHEMA })
  async list(
    @CurrentActor() actor: ActorContext,
    @Query() query: PartyListQueryDto,
  ): Promise<CustomerListResponse> {
    const result = await this.service.list(actor, query);
    return { data: result.items.map(toCustomerResponse), meta: pageMeta(result.page, result.limit, result.total) };
  }

  @Post()
  @RequirePermission(CUSTOMER_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Create a customer', description: 'Requires `customer.manage`.' })
  @ApiBody({ schema: zodToOpenAPI(CreateCustomerRequestSchema) })
  @ApiCreatedResponse({ schema: CUSTOMER_SCHEMA })
  async create(@CurrentActor() actor: ActorContext, @Body() body: CreateCustomerDto): Promise<CustomerResponse> {
    return toCustomerResponse(await this.service.create(actor, body));
  }

  @Get(':id')
  @RequirePermission(CUSTOMER_PERMISSIONS.view)
  @ApiOperation({ summary: 'Get a customer', description: 'Requires `customer.view`.' })
  @ApiOkResponse({ schema: CUSTOMER_SCHEMA })
  async get(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<CustomerResponse> {
    return toCustomerResponse(await this.service.get(actor, id));
  }

  @Patch(':id')
  @RequirePermission(CUSTOMER_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Update a customer', description: 'Requires `customer.manage`.' })
  @ApiBody({ schema: zodToOpenAPI(UpdateCustomerRequestSchema) })
  @ApiOkResponse({ schema: CUSTOMER_SCHEMA })
  async update(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body() body: UpdateCustomerDto,
  ): Promise<CustomerResponse> {
    return toCustomerResponse(await this.service.update(actor, id, body));
  }

  @Delete(':id')
  @RequirePermission(CUSTOMER_PERMISSIONS.manage)
  @HttpCode(204)
  @ApiOperation({ summary: 'Soft-delete a customer', description: 'Requires `customer.manage`.' })
  @ApiNoContentResponse()
  async remove(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<void> {
    await this.service.remove(actor, id);
  }

  @Post(':id/archive')
  @RequirePermission(CUSTOMER_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Archive a customer', description: 'Requires `customer.manage`.' })
  @ApiOkResponse({ schema: CUSTOMER_SCHEMA })
  async archive(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<CustomerResponse> {
    return toCustomerResponse(await this.service.archive(actor, id));
  }

  @Post(':id/restore')
  @RequirePermission(CUSTOMER_PERMISSIONS.manage)
  @ApiOperation({ summary: 'Restore a customer', description: 'Requires `customer.manage`.' })
  @ApiOkResponse({ schema: CUSTOMER_SCHEMA })
  async restore(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<CustomerResponse> {
    return toCustomerResponse(await this.service.restore(actor, id));
  }
}
