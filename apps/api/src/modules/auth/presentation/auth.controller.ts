import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { zodToOpenAPI } from 'nestjs-zod';
import type { Response } from 'express';
import {
  AuthMessageResponseSchema,
  AuthUserResponseSchema,
  type AuthMessageResponse,
  type AuthUserResponse,
} from '@stockflow/types';
import {
  type ActorContext,
  type ContextualRequest,
  CurrentActor,
  Public,
  SESSION_COOKIE_NAME,
  clearSessionCookieOptions,
  parseCookies,
  sessionCookieOptions,
} from '../../../common';
import { UnauthorizedError } from '../../../common/errors';
import { AppConfigService } from '../../../config';
import { AuthService } from '../application/auth.service';
import { MemberService } from '../application/member.service';
import { AcceptInvitationDto, LoginDto, RegisterDto } from './dto';
import { toAuthUserResponse } from './mappers';

/**
 * Identity endpoints. `register`/`login`/`accept-invite` establish a session — they set the httpOnly session
 * cookie and return the authenticated principal. `logout` revokes it. `me` returns the current principal.
 * Session-establishing routes are `@Public()`; the tenant is always derived server-side, never from the body.
 */
@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly members: MemberService,
    private readonly config: AppConfigService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register', description: 'Create an organization and its Owner; opens a session.' })
  @ApiOkResponse({ schema: zodToOpenAPI(AuthUserResponseSchema) })
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthUserResponse> {
    const { principal, sessionToken } = await this.auth.register(body);
    this.issueSession(res, sessionToken);
    return toAuthUserResponse(principal);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Log in', description: 'Verify credentials and open a session.' })
  @ApiOkResponse({ schema: zodToOpenAPI(AuthUserResponseSchema) })
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthUserResponse> {
    const { principal, sessionToken } = await this.auth.login(body);
    this.issueSession(res, sessionToken);
    return toAuthUserResponse(principal);
  }

  @Public()
  @Post('accept-invite')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Accept invitation',
    description: 'Create the invited user account, join the organization, and open a session.',
  })
  @ApiOkResponse({ schema: zodToOpenAPI(AuthUserResponseSchema) })
  async acceptInvite(
    @Body() body: AcceptInvitationDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthUserResponse> {
    const { principal, sessionToken } = await this.members.acceptInvitation(body);
    this.issueSession(res, sessionToken);
    return toAuthUserResponse(principal);
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Log out', description: 'Revoke the current session and clear the cookie.' })
  @ApiOkResponse({ schema: zodToOpenAPI(AuthMessageResponseSchema) })
  async logout(
    @Req() req: ContextualRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthMessageResponse> {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE_NAME];
    if (token) await this.auth.logout(token);
    res.clearCookie(SESSION_COOKIE_NAME, clearSessionCookieOptions(this.config.isProduction));
    return { success: true };
  }

  @Get('me')
  @ApiOperation({ summary: 'Current user', description: 'The authenticated principal (roles + permissions).' })
  @ApiOkResponse({ schema: zodToOpenAPI(AuthUserResponseSchema) })
  async me(@CurrentActor() actor: ActorContext): Promise<AuthUserResponse> {
    if (!actor.actorId) throw new UnauthorizedError();
    return toAuthUserResponse(await this.auth.getPrincipal(actor.organizationId, actor.actorId));
  }

  /** Set the httpOnly session cookie (maxAge tied to the configured session TTL; Secure in production). */
  private issueSession(res: Response, token: string): void {
    res.cookie(
      SESSION_COOKIE_NAME,
      token,
      sessionCookieOptions(this.config.sessionTtlMs, this.config.isProduction),
    );
  }
}
