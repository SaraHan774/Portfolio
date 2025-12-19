/**
 * Logger Utility - 중앙화된 로깅 유틸리티
 *
 * 일관된 로깅 패턴을 제공하고 프로덕션 환경에서
 * 민감한 정보 노출을 방지합니다.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  module?: string;
  action?: string;
  userId?: string;
  [key: string]: unknown;
}

const isDev = import.meta.env.DEV;

/**
 * 로그 포맷팅
 */
const formatLog = (level: LogLevel, message: string, context?: LogContext): string => {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
};

/**
 * 민감한 정보 필터링
 */
const sanitizeContext = (context?: LogContext): LogContext | undefined => {
  if (!context) return undefined;

  const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'credential'];
  const sanitized = { ...context };

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
};

/**
 * Debug 레벨 로깅 (개발 환경에서만)
 */
export const logDebug = (message: string, context?: LogContext): void => {
  if (isDev) {
    console.debug(formatLog('debug', message, sanitizeContext(context)));
  }
};

/**
 * Info 레벨 로깅
 */
export const logInfo = (message: string, context?: LogContext): void => {
  if (isDev) {
    console.info(formatLog('info', message, sanitizeContext(context)));
  }
};

/**
 * Warning 레벨 로깅
 */
export const logWarn = (message: string, context?: LogContext): void => {
  console.warn(formatLog('warn', message, sanitizeContext(context)));
};

/**
 * Error 레벨 로깅
 */
export const logError = (message: string, error?: unknown, context?: LogContext): void => {
  const errorContext = {
    ...sanitizeContext(context),
    errorMessage: error instanceof Error ? error.message : String(error),
    errorStack: isDev && error instanceof Error ? error.stack : undefined,
  };
  console.error(formatLog('error', message, errorContext));
};

/**
 * 모듈별 로거 생성
 */
export const createLogger = (module: string) => ({
  debug: (message: string, context?: Omit<LogContext, 'module'>) =>
    logDebug(message, { ...context, module }),
  info: (message: string, context?: Omit<LogContext, 'module'>) =>
    logInfo(message, { ...context, module }),
  warn: (message: string, context?: Omit<LogContext, 'module'>) =>
    logWarn(message, { ...context, module }),
  error: (message: string, error?: unknown, context?: Omit<LogContext, 'module'>) =>
    logError(message, error, { ...context, module }),
});
