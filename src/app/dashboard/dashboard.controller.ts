import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WorkoutsService } from '../workouts/workouts.service';

function getUserIdFromReq(req: any): string {
  const u: any = req.user ?? {};
  return String(u.sub ?? u.userId ?? u.id ?? '');
}

@UseGuards(AuthGuard('jwt'))
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Get('today')
  async getToday(@Req() req: any) {
    const userId = getUserIdFromReq(req);
    return this.workoutsService.getTodayForDashboard(userId);
  }
}
