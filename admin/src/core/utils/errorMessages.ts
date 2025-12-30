// 에러 메시지 유틸리티 - 사용자 친화적 메시지 생성

import {
  ValidationError,
  NetworkError,
  NotFoundError,
  AuthError,
  PermissionError,
  UploadError,
  getErrorMessage,
} from '../errors';

export interface ErrorDisplayInfo {
  title: string;
  message: string;
  action?: string; // 사용자가 취할 수 있는 조치
  technical?: string; // 기술적 세부사항 (선택적)
}

/**
 * Firebase 에러 코드를 사용자 친화적 메시지로 변환
 */
const getFirebaseErrorMessage = (code: string): ErrorDisplayInfo => {
  const firebaseErrors: Record<string, ErrorDisplayInfo> = {
    'permission-denied': {
      title: '권한 오류',
      message: '이 작업을 수행할 권한이 없습니다.',
      action: '로그인 상태를 확인하거나 관리자에게 문의하세요.',
    },
    'unavailable': {
      title: '서비스 사용 불가',
      message: '현재 서버에 연결할 수 없습니다.',
      action: '인터넷 연결을 확인하거나 잠시 후 다시 시도해주세요.',
    },
    'deadline-exceeded': {
      title: '요청 시간 초과',
      message: '서버 응답 시간이 초과되었습니다.',
      action: '네트워크 상태를 확인하고 다시 시도해주세요.',
    },
    'resource-exhausted': {
      title: '저장 용량 초과',
      message: 'Firebase 저장 용량 또는 요청 한도를 초과했습니다.',
      action: '관리자에게 문의하여 용량을 늘려주세요.',
    },
    'quota-exceeded': {
      title: '할당량 초과',
      message: 'Firebase 일일 할당량을 초과했습니다.',
      action: '내일 다시 시도하거나 관리자에게 문의하세요.',
    },
    'unauthenticated': {
      title: '인증 필요',
      message: '로그인이 필요합니다.',
      action: '로그인 후 다시 시도해주세요.',
    },
    'already-exists': {
      title: '이미 존재함',
      message: '동일한 작업이 이미 존재합니다.',
      action: '다른 제목으로 시도하거나 기존 작업을 수정하세요.',
    },
    'not-found': {
      title: '작업을 찾을 수 없음',
      message: '수정하려는 작업이 삭제되었거나 존재하지 않습니다.',
      action: '작업 목록을 새로고침하고 다시 확인하세요.',
    },
  };

  return (
    firebaseErrors[code] || {
      title: '알 수 없는 오류',
      message: `오류 코드: ${code}`,
      action: '다시 시도해주세요.',
    }
  );
};

/**
 * Validation 에러 메시지 생성
 */
const getValidationErrorMessage = (error: ValidationError): ErrorDisplayInfo => {
  const code = error.code;
  const validationMessages: Record<string, ErrorDisplayInfo> = {
    TITLE_REQUIRED: {
      title: '제목 누락',
      message: '작업 제목은 필수 항목입니다.',
      action: '제목을 입력해주세요.',
    },
    TITLE_TOO_LONG: {
      title: '제목 길이 초과',
      message: '작업 제목은 200자를 초과할 수 없습니다.',
      action: '제목을 줄여주세요.',
      technical: `현재: ${error.message}`,
    },
    CAPTION_TOO_LONG: {
      title: '캡션 길이 초과',
      message: '캡션은 1000자를 초과할 수 없습니다.',
      action: '캡션 내용을 줄여주세요.',
    },
    INVALID_YEAR: {
      title: '연도 오류',
      message: '유효하지 않은 연도입니다.',
      action: '1900년부터 현재+10년 사이의 연도를 입력하세요.',
    },
    ID_REQUIRED: {
      title: '작업 ID 누락',
      message: '작업 ID가 필요합니다.',
      action: '페이지를 새로고침하고 다시 시도하세요.',
    },
  };

  return (
    validationMessages[code] || {
      title: '입력 오류',
      message: error.message,
      action: '입력 내용을 확인해주세요.',
    }
  );
};

/**
 * 모든 에러를 사용자 친화적 메시지로 변환
 */
export const getErrorDisplayInfo = (error: unknown): ErrorDisplayInfo => {
  // Validation Error
  if (error instanceof ValidationError) {
    return getValidationErrorMessage(error);
  }

  // Not Found Error
  if (error instanceof NotFoundError) {
    return {
      title: '작업을 찾을 수 없음',
      message: error.message || '수정하려는 작업이 존재하지 않습니다.',
      action: '작업 목록으로 돌아가서 다시 확인하세요.',
    };
  }

  // Auth Error
  if (error instanceof AuthError) {
    return {
      title: '인증 오류',
      message: error.message || '인증에 실패했습니다.',
      action: '다시 로그인해주세요.',
    };
  }

  // Permission Error
  if (error instanceof PermissionError) {
    return {
      title: '권한 오류',
      message: error.message || '이 작업을 수행할 권한이 없습니다.',
      action: '관리자에게 문의하세요.',
    };
  }

  // Upload Error
  if (error instanceof UploadError) {
    return {
      title: '업로드 실패',
      message: error.message || '파일 업로드에 실패했습니다.',
      action: '파일 크기와 형식을 확인하고 다시 시도하세요.',
      technical: error.fileName ? `파일: ${error.fileName}` : undefined,
    };
  }

  // Network Error
  if (error instanceof NetworkError) {
    return {
      title: '네트워크 오류',
      message: error.message || '서버와 통신할 수 없습니다.',
      action: '인터넷 연결을 확인하고 다시 시도해주세요.',
    };
  }

  // Firebase Error (code 속성이 있는 경우)
  if (error && typeof error === 'object' && 'code' in error) {
    const firebaseError = error as { code: string; message?: string };
    return getFirebaseErrorMessage(firebaseError.code);
  }

  // Form Validation Error (Ant Design)
  if (error && typeof error === 'object' && 'errorFields' in error) {
    const formError = error as { errorFields: Array<{ name: string[]; errors: string[] }> };
    const firstError = formError.errorFields[0];
    if (firstError && firstError.errors.length > 0) {
      return {
        title: '입력 확인 필요',
        message: firstError.errors[0],
        action: `${firstError.name.join('.')} 필드를 확인해주세요.`,
      };
    }
  }

  // 기본 Error 객체
  const errorMessage = getErrorMessage(error);
  return {
    title: '오류 발생',
    message: errorMessage,
    action: '다시 시도해주세요. 문제가 계속되면 관리자에게 문의하세요.',
  };
};

/**
 * 에러 정보를 콘솔에 로깅 (개발 환경)
 */
export const logErrorForDev = (error: unknown, context?: string): void => {
  if (import.meta.env.DEV) {
    console.group(`🔴 Error ${context ? `in ${context}` : ''}`);
    console.error('Error object:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
    console.groupEnd();
  }
};
