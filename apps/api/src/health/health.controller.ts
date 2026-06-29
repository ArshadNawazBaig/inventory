import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { APP } from '@stockflow/config';
import type { HealthResponse } from '@stockflow/types';
import { Public } from '../common';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @Public()
  @ApiOkResponse({ description: 'Service is healthy.' })
  check(): HealthResponse {
    return {
      status: 'ok',
      service: APP.name,
      time: new Date().toISOString(),
    };
  }
}
