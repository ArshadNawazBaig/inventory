import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { zodToOpenAPI } from 'nestjs-zod';
import {
  OrganizationSettingsResponseSchema,
  SETTINGS_PERMISSIONS,
  type OrganizationSettingsResponse,
} from '@stockflow/types';
import { type ActorContext, CurrentActor, RequirePermission } from '../../../common';
import { SettingsService } from '../application/settings.service';
import { UpdateOrganizationSettingsDto } from './dto';
import { toOrganizationSettingsResponse } from './mappers';

@ApiTags('settings')
@Controller({ path: 'settings', version: '1' })
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  @RequirePermission(SETTINGS_PERMISSIONS.view)
  @ApiOperation({
    summary: 'Get organization settings',
    description: 'Requires `settings.view`. Returns the tenant settings, or safe defaults if never saved.',
  })
  @ApiOkResponse({ schema: zodToOpenAPI(OrganizationSettingsResponseSchema) })
  async get(@CurrentActor() actor: ActorContext): Promise<OrganizationSettingsResponse> {
    return toOrganizationSettingsResponse(await this.service.get(actor));
  }

  @Patch()
  @RequirePermission(SETTINGS_PERMISSIONS.manage)
  @ApiOperation({
    summary: 'Update organization settings',
    description: 'Requires `settings.manage`. Partial update; `allowNegativeStock` changes the ledger policy.',
  })
  @ApiOkResponse({ schema: zodToOpenAPI(OrganizationSettingsResponseSchema) })
  async update(
    @CurrentActor() actor: ActorContext,
    @Body() body: UpdateOrganizationSettingsDto,
  ): Promise<OrganizationSettingsResponse> {
    return toOrganizationSettingsResponse(await this.service.update(actor, body));
  }
}
