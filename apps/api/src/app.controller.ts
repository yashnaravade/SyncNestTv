import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Health check endpoint
   * Returns the status and readiness of the API
   */
  @Get()
  health() {
    return this.appService.getHealth();
  }
}
