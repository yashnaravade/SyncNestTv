import { Injectable } from '@nestjs/common';

interface HealthCheckResponse {
  status: 'ok';
  timestamp: string;
  message: string;
  version: string;
}

@Injectable()
export class AppService {
  /**
   * Returns health check status
   */
  getHealth(): HealthCheckResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'StreamTogether API is ready.',
      version: '0.1.0',
    };
  }
}
