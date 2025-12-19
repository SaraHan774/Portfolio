// 커스텀 에러 클래스

/**
 * 기본 커스텀 에러 클래스
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where error was thrown (V8 engines)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * 유효성 검사 에러
 */
export class ValidationError extends AppError {
  public readonly field?: string;

  constructor(message: string, codeOrField?: string, details?: Record<string, unknown>) {
    super(message, codeOrField || 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
    this.field = codeOrField;
  }
}

/**
 * 네트워크 에러
 */
export class NetworkError extends AppError {
  public readonly statusCode?: number;

  constructor(message: string, statusCode?: number, details?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
    this.statusCode = statusCode;
  }
}

/**
 * 인증 에러
 */
export class AuthError extends AppError {
  constructor(message: string, code?: string, details?: Record<string, unknown>) {
    super(message, code || 'AUTH_ERROR', details);
    this.name = 'AuthError';
  }
}

/**
 * 권한 에러
 */
export class PermissionError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'PERMISSION_ERROR', details);
    this.name = 'PermissionError';
  }
}

/**
 * 리소스 미발견 에러
 */
export class NotFoundError extends AppError {
  public readonly resource?: string;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'NOT_FOUND_ERROR', details);
    this.name = 'NotFoundError';
    this.resource = details?.resource as string | undefined;
  }
}

/**
 * 파일 업로드 에러
 */
export class UploadError extends AppError {
  public readonly fileName?: string;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'UPLOAD_ERROR', details);
    this.name = 'UploadError';
    this.fileName = details?.fileName as string | undefined;
  }
}

/**
 * 에러가 특정 타입인지 확인
 */
export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};

export const isValidationError = (error: unknown): error is ValidationError => {
  return error instanceof ValidationError;
};

export const isNetworkError = (error: unknown): error is NetworkError => {
  return error instanceof NetworkError;
};

export const isAuthError = (error: unknown): error is AuthError => {
  return error instanceof AuthError;
};

export const isNotFoundError = (error: unknown): error is NotFoundError => {
  return error instanceof NotFoundError;
};

/**
 * 에러 메시지 추출 (unknown 타입 안전 처리)
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '알 수 없는 오류가 발생했습니다';
};
