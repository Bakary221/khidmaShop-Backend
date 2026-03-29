import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, ErrorMessages } from '../../common/constants/error-codes';

export class CustomException extends HttpException {
  constructor(
    private errorCode: ErrorCode,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    details?: string,
  ) {
    const message = ErrorMessages[errorCode] || 'Erreur inconnue';
    super(
      {
        success: false,
        message,
        data: null,
        error: {
          code: errorCode,
          details: details || message,
        },
      },
      statusCode,
    );
  }

  getErrorCode(): ErrorCode {
    return this.errorCode;
  }
}

export class UnauthorizedException extends CustomException {
  constructor(details?: string) {
    super(
      ErrorCode.AUTH_UNAUTHORIZED,
      HttpStatus.UNAUTHORIZED,
      details,
    );
  }
}

export class ForbiddenException extends CustomException {
  constructor(details?: string) {
    super(
      ErrorCode.AUTH_FORBIDDEN,
      HttpStatus.FORBIDDEN,
      details,
    );
  }
}

export class NotFoundException extends CustomException {
  constructor(resource: string) {
    super(
      ErrorCode.RESOURCE_NOT_FOUND,
      HttpStatus.NOT_FOUND,
      `${resource} not found`,
    );
  }
}

export class BadRequestException extends CustomException {
  constructor(code: ErrorCode, details?: string) {
    super(code, HttpStatus.BAD_REQUEST, details);
  }
}

export class ConflictException extends CustomException {
  constructor(code: ErrorCode, details?: string) {
    super(code, HttpStatus.CONFLICT, details);
  }
}
