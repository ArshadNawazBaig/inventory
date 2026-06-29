import { createZodDto } from 'nestjs-zod';
import {
  AcceptInvitationRequestSchema,
  InviteMemberRequestSchema,
  LoginRequestSchema,
  RegisterRequestSchema,
  UpdateMemberRolesRequestSchema,
} from '@stockflow/types';

/** NestJS DTOs from the shared Zod contracts — validated by the global ZodValidationPipe (input validation). */
export class RegisterDto extends createZodDto(RegisterRequestSchema) {}
export class LoginDto extends createZodDto(LoginRequestSchema) {}
export class AcceptInvitationDto extends createZodDto(AcceptInvitationRequestSchema) {}
export class InviteMemberDto extends createZodDto(InviteMemberRequestSchema) {}
export class UpdateMemberRolesDto extends createZodDto(UpdateMemberRolesRequestSchema) {}
