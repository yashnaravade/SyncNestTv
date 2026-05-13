import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path?: string;
}

/**
 * Global HTTP Exception Filter
 * Provides standardized error responses for all HTTP exceptions.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message: (exceptionResponse as any).message || exception.message || 'Internal Server Error',
      error: (exceptionResponse as any).error || HttpStatus[status] || 'Unknown Error',
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logger.error(`${request.method} ${request.url}`, JSON.stringify(errorResponse));

    response.status(status).json(errorResponse);
  }
}
