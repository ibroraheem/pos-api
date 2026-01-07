import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) { }

  @Get()
  pull(@Query('lastPulledAt') lastPulledAt: string, @Request() req) {
    return this.syncService.pull(req.user.tenantId, lastPulledAt);
  }
}
