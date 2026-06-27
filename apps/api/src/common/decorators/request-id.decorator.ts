import { type ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { ContextualRequest } from '../http/contextual-request';

/** Injects the current request's correlation id into a handler parameter. */
export const ReqId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string =>
    ctx.switchToHttp().getRequest<ContextualRequest>().requestId,
);
