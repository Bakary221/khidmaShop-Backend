import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorCode } from '../../common/constants/error-codes';
import { getLogger } from '../../common/utils/logger';

const logger = getLogger('HttpExceptionFilter');

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    let responseBody: any;

    // If it's our custom exception with structured error
    const exceptionResponse = exception.getResponse();
    if (
      typeof exceptionResponse === 'object' &&
      'success' in exceptionResponse &&
      'error' in exceptionResponse
    ) {
      responseBody = exceptionResponse;
    } else {
      // Generic HTTP exception handling
      responseBody = {
        success: false,
        message:
          exception.message ||
          'Une erreur est survenue',
        data: null,
        error: {
          code:
            status === HttpStatus.NOT_FOUND
              ? ErrorCode.RESOURCE_NOT_FOUND
              : status === HttpStatus.UNAUTHORIZED
                ? ErrorCode.AUTH_UNAUTHORIZED
                : status === HttpStatus.FORBIDDEN
                  ? ErrorCode.AUTH_FORBIDDEN
                  : ErrorCode.INTERNAL_SERVER_ERROR,
          details: exception.message,
        },
      };
    }

    logger.warn(`Exception thrown: ${exception.message}`, {
      statusCode: status,
      errorCode: responseBody.error?.code,
    });

    response.status(status).json(responseBody);
  }
}
