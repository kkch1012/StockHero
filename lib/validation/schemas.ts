/**
 * API 입력 검증 스키마
 * Zod 없이 직접 구현한 가벼운 유효성 검증
 */

// 검증 결과 타입
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 기본 검증 함수들
export const validators = {
  // 문자열 검증
  string: (value: unknown, options?: { min?: number; max?: number; pattern?: RegExp }) => {
    if (typeof value !== 'string') return { valid: false, error: '문자열이어야 합니다' };
    if (options?.min && value.length < options.min) return { valid: false, error: `최소 ${options.min}자 이상이어야 합니다` };
    if (options?.max && value.length > options.max) return { valid: false, error: `최대 ${options.max}자까지 가능합니다` };
    if (options?.pattern && !options.pattern.test(value)) return { valid: false, error: '형식이 올바르지 않습니다' };
    return { valid: true, value };
  },

  // 숫자 검증
  number: (value: unknown, options?: { min?: number; max?: number; integer?: boolean }) => {
    const num = typeof value === 'string' ? Number(value) : value;
    if (typeof num !== 'number' || isNaN(num)) return { valid: false, error: '숫자여야 합니다' };
    if (options?.integer && !Number.isInteger(num)) return { valid: false, error: '정수여야 합니다' };
    if (options?.min !== undefined && num < options.min) return { valid: false, error: `${options.min} 이상이어야 합니다` };
    if (options?.max !== undefined && num > options.max) return { valid: false, error: `${options.max} 이하여야 합니다` };
    return { valid: true, value: num };
  },

  // 배열 검증
  array: <T>(value: unknown, itemValidator?: (item: unknown) => { valid: boolean; value?: T; error?: string }, options?: { min?: number; max?: number }) => {
    if (!Array.isArray(value)) return { valid: false, error: '배열이어야 합니다' };
    if (options?.min && value.length < options.min) return { valid: false, error: `최소 ${options.min}개 항목이 필요합니다` };
    if (options?.max && value.length > options.max) return { valid: false, error: `최대 ${options.max}개 항목까지 가능합니다` };

    if (itemValidator) {
      const validatedItems: T[] = [];
      for (let i = 0; i < value.length; i++) {
        const result = itemValidator(value[i]);
        if (!result.valid) return { valid: false, error: `항목 ${i + 1}: ${result.error}` };
        validatedItems.push(result.value as T);
      }
      return { valid: true, value: validatedItems };
    }

    return { valid: true, value };
  },

  // enum 검증
  enum: <T extends string>(value: unknown, allowedValues: readonly T[]) => {
    if (typeof value !== 'string') return { valid: false, error: '문자열이어야 합니다' };
    if (!allowedValues.includes(value as T)) {
      return { valid: false, error: `허용된 값: ${allowedValues.join(', ')}` };
    }
    return { valid: true, value: value as T };
  },

  // 이메일 검증
  email: (value: unknown) => {
    if (typeof value !== 'string') return { valid: false, error: '문자열이어야 합니다' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return { valid: false, error: '유효한 이메일 형식이 아닙니다' };
    return { valid: true, value };
  },

  // 불리언 검증
  boolean: (value: unknown) => {
    if (typeof value !== 'boolean') return { valid: false, error: '불리언이어야 합니다' };
    return { valid: true, value };
  },

  // 선택적 필드
  optional: <T>(validator: (value: unknown) => { valid: boolean; value?: T; error?: string }) => {
    return (value: unknown) => {
      if (value === undefined || value === null) return { valid: true, value: undefined };
      return validator(value);
    };
  },
};

// 캐릭터 타입 검증
export const CHARACTER_TYPES = ['claude', 'gemini', 'gpt'] as const;
export type CharacterTypeValidated = typeof CHARACTER_TYPES[number];

export function validateCharacterType(value: unknown): ValidationResult<CharacterTypeValidated> {
  const result = validators.enum(value, CHARACTER_TYPES);
  return result.valid
    ? { success: true, data: result.value }
    : { success: false, error: result.error };
}

// 채팅 메시지 검증
export interface ChatMessageValidated {
  role: 'user' | 'assistant';
  content: string;
}

export function validateChatMessage(value: unknown): ValidationResult<ChatMessageValidated> {
  if (!value || typeof value !== 'object') {
    return { success: false, error: '메시지 객체가 필요합니다' };
  }

  const msg = value as Record<string, unknown>;

  const roleResult = validators.enum(msg.role, ['user', 'assistant'] as const);
  if (!roleResult.valid) return { success: false, error: `role: ${roleResult.error}` };

  const contentResult = validators.string(msg.content, { min: 1, max: 10000 });
  if (!contentResult.valid) return { success: false, error: `content: ${contentResult.error}` };

  return {
    success: true,
    data: {
      role: roleResult.value!,
      content: contentResult.value!,
    },
  };
}

// 채팅 요청 검증
export interface ChatRequestValidated {
  characterType: CharacterTypeValidated;
  messages: ChatMessageValidated[];
  holdings?: Array<{
    name: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
  }>;
  stockData?: {
    symbol: string;
    name: string;
    currentPrice: number;
    change: number;
    changePercent: number;
  };
  isInitialAnalysis?: boolean;
  analysisType?: 'initial' | 'detailed' | 'strategy' | 'risk' | 'conclusion';
  turn?: number;
  isDebateMode?: boolean;
}

export function validateChatRequest(body: unknown): ValidationResult<ChatRequestValidated> {
  if (!body || typeof body !== 'object') {
    return { success: false, error: '요청 본문이 필요합니다' };
  }

  const req = body as Record<string, unknown>;

  // characterType 검증
  const charResult = validateCharacterType(req.characterType);
  if (!charResult.success) return { success: false, error: `characterType: ${charResult.error}` };

  // messages 검증
  if (!Array.isArray(req.messages)) {
    return { success: false, error: 'messages는 배열이어야 합니다' };
  }

  if (req.messages.length === 0) {
    return { success: false, error: '최소 1개의 메시지가 필요합니다' };
  }

  if (req.messages.length > 50) {
    return { success: false, error: '메시지는 최대 50개까지 가능합니다' };
  }

  const validatedMessages: ChatMessageValidated[] = [];
  for (let i = 0; i < req.messages.length; i++) {
    const msgResult = validateChatMessage(req.messages[i]);
    if (!msgResult.success) {
      return { success: false, error: `messages[${i}]: ${msgResult.error}` };
    }
    validatedMessages.push(msgResult.data!);
  }

  // analysisType 검증 (선택적)
  let analysisType: ChatRequestValidated['analysisType'];
  if (req.analysisType !== undefined) {
    const analysisResult = validators.enum(req.analysisType, ['initial', 'detailed', 'strategy', 'risk', 'conclusion'] as const);
    if (!analysisResult.valid) return { success: false, error: `analysisType: ${analysisResult.error}` };
    analysisType = analysisResult.value;
  }

  // turn 검증 (선택적)
  let turn: number | undefined;
  if (req.turn !== undefined) {
    const turnResult = validators.number(req.turn, { min: 1, max: 10, integer: true });
    if (!turnResult.valid) return { success: false, error: `turn: ${turnResult.error}` };
    turn = turnResult.value;
  }

  return {
    success: true,
    data: {
      characterType: charResult.data!,
      messages: validatedMessages,
      holdings: req.holdings as ChatRequestValidated['holdings'],
      stockData: req.stockData as ChatRequestValidated['stockData'],
      isInitialAnalysis: req.isInitialAnalysis === true,
      analysisType,
      turn,
      isDebateMode: req.isDebateMode === true,
    },
  };
}

// 결제 확인 요청 검증
export interface PaymentConfirmValidated {
  paymentId: string;
  orderId: string;
}

export function validatePaymentConfirm(body: unknown): ValidationResult<PaymentConfirmValidated> {
  if (!body || typeof body !== 'object') {
    return { success: false, error: '요청 본문이 필요합니다' };
  }

  const req = body as Record<string, unknown>;

  const paymentIdResult = validators.string(req.paymentId, { min: 1, max: 200 });
  if (!paymentIdResult.valid) return { success: false, error: `paymentId: ${paymentIdResult.error}` };

  const orderIdResult = validators.string(req.orderId, { min: 1, max: 200 });
  if (!orderIdResult.valid) return { success: false, error: `orderId: ${orderIdResult.error}` };

  return {
    success: true,
    data: {
      paymentId: paymentIdResult.value!,
      orderId: orderIdResult.value!,
    },
  };
}

// 주식 심볼 검증
export function validateStockSymbol(value: unknown): ValidationResult<string> {
  const result = validators.string(value, {
    min: 1,
    max: 20,
    pattern: /^[A-Z0-9.]+$/i  // 알파벳, 숫자, 점만 허용
  });

  return result.valid
    ? { success: true, data: result.value }
    : { success: false, error: result.error };
}

// XSS 방지를 위한 문자열 이스케이프
export function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}

// 에러 메시지 sanitize (내부 정보 노출 방지)
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // 스택 트레이스나 내부 경로 제거
    const message = error.message;

    // 민감한 정보 패턴 제거
    const sanitized = message
      .replace(/\/[\w/.-]+/g, '[path]')  // 파일 경로
      .replace(/at .+/g, '')  // 스택 트레이스
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[ip]')  // IP 주소
      .replace(/Bearer .+/g, 'Bearer [token]')  // 토큰
      .replace(/key[=:]\s*\w+/gi, 'key=[hidden]')  // API 키
      .trim();

    return sanitized || '처리 중 오류가 발생했습니다';
  }

  return '처리 중 오류가 발생했습니다';
}
