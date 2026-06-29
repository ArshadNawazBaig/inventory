import { Module } from '@nestjs/common';
import { SESSION_AUTHENTICATOR } from '../../common/auth';
import { mongoFeature, repositoryProvider } from '../../common/persistence';
import {
  ObjectIdGenerator,
  SystemClock,
  type ResourceClock,
  type ResourceIdGenerator,
} from '../../common/resource';
import { AppConfigService } from '../../config';
import { AuthService } from './application/auth.service';
import { MemberService } from './application/member.service';
import {
  AUTH_CLOCK,
  AUTH_ID_GENERATOR,
  INVITATION_REPOSITORY,
  MEMBERSHIP_REPOSITORY,
  ORGANIZATION_REPOSITORY,
  PASSWORD_HASHER,
  SESSION_REPOSITORY,
  TOKEN_GENERATOR,
  USER_REPOSITORY,
  type InvitationRepository,
  type MembershipRepository,
  type OrganizationRepository,
  type PasswordHasher,
  type SessionRepository,
  type TokenGenerator,
  type UserRepository,
} from './application/ports';
import { CryptoTokenGenerator, ScryptPasswordHasher } from './infrastructure/adapters';
import {
  InMemoryInvitationRepository,
  InMemoryMembershipRepository,
  InMemoryOrganizationRepository,
  InMemorySessionRepository,
  InMemoryUserRepository,
} from './infrastructure/in-memory.repositories';
import {
  MongoInvitationRepository,
  MongoMembershipRepository,
  MongoOrganizationRepository,
  MongoSessionRepository,
  MongoUserRepository,
} from './infrastructure/mongoose/mongo.repositories';
import {
  INVITATION_MODEL,
  InvitationSchema,
  MEMBERSHIP_MODEL,
  MembershipSchema,
  ORGANIZATION_MODEL,
  OrganizationSchema,
  SESSION_MODEL,
  SessionSchema,
  USER_MODEL,
  UserSchema,
} from './infrastructure/mongoose/schemas';
import { AuthController } from './presentation/auth.controller';
import { MemberController, RoleController } from './presentation/member.controller';

/**
 * Auth module — identity, sessions and RBAC. Owns the org/user/membership/session/invitation collections and
 * binds the cross-cutting `SESSION_AUTHENTICATOR` port (the global AuthGuard depends on it) to its
 * `AuthService`. Ports run on in-memory adapters by default and Mongoose under `PERSISTENCE_DRIVER=mongo`
 * (ADR-030). Better Auth becomes the production adapter for credentials/sessions (a documented follow-up).
 */
@Module({
  imports: [
    ...mongoFeature([
      { name: ORGANIZATION_MODEL, schema: OrganizationSchema },
      { name: USER_MODEL, schema: UserSchema },
      { name: MEMBERSHIP_MODEL, schema: MembershipSchema },
      { name: SESSION_MODEL, schema: SessionSchema },
      { name: INVITATION_MODEL, schema: InvitationSchema },
    ]),
  ],
  controllers: [AuthController, MemberController, RoleController],
  providers: [
    repositoryProvider(ORGANIZATION_REPOSITORY, InMemoryOrganizationRepository, MongoOrganizationRepository),
    repositoryProvider(USER_REPOSITORY, InMemoryUserRepository, MongoUserRepository),
    repositoryProvider(MEMBERSHIP_REPOSITORY, InMemoryMembershipRepository, MongoMembershipRepository),
    repositoryProvider(SESSION_REPOSITORY, InMemorySessionRepository, MongoSessionRepository),
    repositoryProvider(INVITATION_REPOSITORY, InMemoryInvitationRepository, MongoInvitationRepository),
    { provide: PASSWORD_HASHER, useClass: ScryptPasswordHasher },
    { provide: TOKEN_GENERATOR, useClass: CryptoTokenGenerator },
    { provide: AUTH_ID_GENERATOR, useValue: new ObjectIdGenerator() },
    { provide: AUTH_CLOCK, useValue: new SystemClock() },
    {
      provide: AuthService,
      inject: [
        ORGANIZATION_REPOSITORY,
        USER_REPOSITORY,
        MEMBERSHIP_REPOSITORY,
        SESSION_REPOSITORY,
        PASSWORD_HASHER,
        TOKEN_GENERATOR,
        AUTH_ID_GENERATOR,
        AUTH_CLOCK,
        AppConfigService,
      ],
      useFactory: (
        organizations: OrganizationRepository,
        users: UserRepository,
        memberships: MembershipRepository,
        sessions: SessionRepository,
        hasher: PasswordHasher,
        tokens: TokenGenerator,
        ids: ResourceIdGenerator,
        clock: ResourceClock,
        config: AppConfigService,
      ): AuthService =>
        new AuthService(
          organizations,
          users,
          memberships,
          sessions,
          hasher,
          tokens,
          ids,
          clock,
          config.sessionTtlMs,
        ),
    },
    {
      provide: MemberService,
      inject: [
        USER_REPOSITORY,
        MEMBERSHIP_REPOSITORY,
        INVITATION_REPOSITORY,
        SESSION_REPOSITORY,
        PASSWORD_HASHER,
        TOKEN_GENERATOR,
        AUTH_ID_GENERATOR,
        AUTH_CLOCK,
        AuthService,
        AppConfigService,
      ],
      useFactory: (
        users: UserRepository,
        memberships: MembershipRepository,
        invitations: InvitationRepository,
        sessions: SessionRepository,
        hasher: PasswordHasher,
        tokens: TokenGenerator,
        ids: ResourceIdGenerator,
        clock: ResourceClock,
        auth: AuthService,
        config: AppConfigService,
      ): MemberService =>
        new MemberService(
          users,
          memberships,
          invitations,
          sessions,
          hasher,
          tokens,
          ids,
          clock,
          auth,
          config.invitationTtlMs,
          config.webBaseUrl,
        ),
    },
    { provide: SESSION_AUTHENTICATOR, useExisting: AuthService },
  ],
  exports: [SESSION_AUTHENTICATOR],
})
export class AuthModule {}
