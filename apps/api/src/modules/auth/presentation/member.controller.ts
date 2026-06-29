import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { zodToOpenAPI } from 'nestjs-zod';
import {
  AuthMessageResponseSchema,
  InvitationResponseSchema,
  MEMBER_PERMISSIONS,
  MemberListResponseSchema,
  MemberResponseSchema,
  ROLE_PERMISSIONS,
  RoleListResponseSchema,
  SYSTEM_ROLES,
  type AuthMessageResponse,
  type InvitationResponse,
  type MemberListResponse,
  type MemberResponse,
  type RoleListResponse,
} from '@stockflow/types';
import { type ActorContext, CurrentActor, RequirePermission } from '../../../common';
import { MemberService } from '../application/member.service';
import { InviteMemberDto, UpdateMemberRolesDto } from './dto';
import { toInvitationResponse, toMemberResponse, toRoleResponse } from './mappers';

/**
 * Member management — the org's people list, invitations, role assignment and removal. Every route is RBAC-gated
 * and tenant-scoped to the actor's organization.
 */
@ApiTags('members')
@Controller({ path: 'members', version: '1' })
export class MemberController {
  constructor(private readonly members: MemberService) {}

  @Get()
  @RequirePermission(MEMBER_PERMISSIONS.view)
  @ApiOperation({ summary: 'List members', description: 'Requires `member.view`. Active members + pending invites.' })
  @ApiOkResponse({ schema: zodToOpenAPI(MemberListResponseSchema) })
  async list(@CurrentActor() actor: ActorContext): Promise<MemberListResponse> {
    const members = await this.members.listMembers(actor);
    return { data: members.map(toMemberResponse) };
  }

  @Post('invite')
  @RequirePermission(MEMBER_PERMISSIONS.invite)
  @ApiOperation({ summary: 'Invite member', description: 'Requires `member.invite`. Creates a pending invitation.' })
  @ApiOkResponse({ schema: zodToOpenAPI(InvitationResponseSchema) })
  async invite(
    @CurrentActor() actor: ActorContext,
    @Body() body: InviteMemberDto,
  ): Promise<InvitationResponse> {
    return toInvitationResponse(await this.members.invite(actor, body));
  }

  @Patch(':id/roles')
  @RequirePermission(MEMBER_PERMISSIONS.update)
  @ApiOperation({ summary: 'Update member roles', description: 'Requires `member.update`. Replaces a member\'s roles.' })
  @ApiOkResponse({ schema: zodToOpenAPI(MemberResponseSchema) })
  async updateRoles(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body() body: UpdateMemberRolesDto,
  ): Promise<MemberResponse> {
    return toMemberResponse(await this.members.updateRoles(actor, id, body));
  }

  @Delete(':id')
  @RequirePermission(MEMBER_PERMISSIONS.remove)
  @HttpCode(200)
  @ApiOperation({ summary: 'Remove member', description: 'Requires `member.remove`. Removes a member and revokes sessions.' })
  @ApiOkResponse({ schema: zodToOpenAPI(AuthMessageResponseSchema) })
  async remove(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
  ): Promise<AuthMessageResponse> {
    await this.members.removeMember(actor, id);
    return { success: true };
  }
}

/** Read-only catalog of the built-in roles + their permission bundles (drives the role pickers in the UI). */
@ApiTags('roles')
@Controller({ path: 'roles', version: '1' })
export class RoleController {
  @Get()
  @RequirePermission(ROLE_PERMISSIONS.view)
  @ApiOperation({ summary: 'List roles', description: 'Requires `role.view`. The system roles and their permissions.' })
  @ApiOkResponse({ schema: zodToOpenAPI(RoleListResponseSchema) })
  list(): RoleListResponse {
    return { data: SYSTEM_ROLES.map(toRoleResponse) };
  }
}
