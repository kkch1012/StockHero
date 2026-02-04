/**
 * CRON 작업 인증 유틸리티
 * Vercel Cron 및 수동 호출에 대한 보안 인증
 */

import { NextRequest } from 'next/server';
import crypto from 'crypto';

interface AuthResult {
  authorized: boolean;
  source: 'vercel' | 'manual' | 'unauthorized';
  error?: string;
}

/**
 * CRON 요청 인증
 * 1. Vercel Cron의 자동 인증 헤더 확인
 * 2. 수동 호출 시 HMAC 서명 검증
 */
export function verifyCronAuth(request: NextRequest): AuthResult {
  // 1. Vercel Cron 자동 인증 확인
  // Vercel은 cron 작업 실행 시 특별한 헤더를 추가
  const vercelCronSignature = request.headers.get('x-vercel-cron-signature');
  if (vercelCronSignature && process.env.CRON_SECRET) {
    // Vercel이 생성한 서명 검증
    const isValidVercelSignature = verifyVercelCronSignature(
      vercelCronSignature,
      process.env.CRON_SECRET
    );
    if (isValidVercelSignature) {
      return { authorized: true, source: 'vercel' };
    }
  }

  // 2. Authorization 헤더로 수동 인증 확인
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  // CRON_SECRET이 설정되지 않은 경우
  if (!cronSecret) {
    console.warn('[Cron Auth] CRON_SECRET not configured');
    // 개발 환경에서만 허용
    if (process.env.NODE_ENV === 'development') {
      return { authorized: true, source: 'manual' };
    }
    return {
      authorized: false,
      source: 'unauthorized',
      error: 'CRON_SECRET not configured',
    };
  }

  // Authorization 헤더가 없는 경우
  if (!authHeader) {
    return {
      authorized: false,
      source: 'unauthorized',
      error: 'Authorization header required',
    };
  }

  // Bearer 토큰 형식 확인
  if (!authHeader.startsWith('Bearer ')) {
    return {
      authorized: false,
      source: 'unauthorized',
      error: 'Invalid authorization format',
    };
  }

  const providedToken = authHeader.slice(7); // 'Bearer ' 제거

  // 3. HMAC 기반 토큰 검증 (타이밍 공격 방지)
  const isValid = verifyToken(providedToken, cronSecret);

  if (!isValid) {
    return {
      authorized: false,
      source: 'unauthorized',
      error: 'Invalid authorization token',
    };
  }

  return { authorized: true, source: 'manual' };
}

/**
 * Vercel Cron 서명 검증
 */
function verifyVercelCronSignature(signature: string, secret: string): boolean {
  try {
    // Vercel은 HMAC-SHA256으로 서명
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update('vercel-cron')
      .digest('hex');

    // 타이밍 공격 방지를 위한 상수 시간 비교
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * 토큰 검증 (타이밍 공격 방지)
 */
function verifyToken(providedToken: string, secret: string): boolean {
  try {
    // 단순 비교 대신 타이밍 공격에 안전한 비교 사용
    const providedBuffer = Buffer.from(providedToken);
    const secretBuffer = Buffer.from(secret);

    // 길이가 다르면 일정한 시간 소모 후 false 반환
    if (providedBuffer.length !== secretBuffer.length) {
      // 길이가 달라도 일정 시간 소모
      crypto.timingSafeEqual(
        Buffer.from('a'.repeat(32)),
        Buffer.from('b'.repeat(32))
      );
      return false;
    }

    return crypto.timingSafeEqual(providedBuffer, secretBuffer);
  } catch {
    return false;
  }
}

/**
 * CRON 인증 미들웨어 헬퍼
 * API 라우트에서 간편하게 사용
 */
export function withCronAuth<T>(
  handler: (request: NextRequest) => Promise<T>
): (request: NextRequest) => Promise<T | Response> {
  return async (request: NextRequest) => {
    const authResult = verifyCronAuth(request);

    if (!authResult.authorized) {
      return new Response(
        JSON.stringify({ error: authResult.error || 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return handler(request);
  };
}

/**
 * CRON 작업 실행 로깅
 */
export function logCronExecution(
  jobName: string,
  source: 'vercel' | 'manual',
  success: boolean,
  details?: Record<string, unknown>
) {
  const logEntry = {
    type: 'cron_execution',
    job: jobName,
    source,
    success,
    timestamp: new Date().toISOString(),
    ...details,
  };

  if (success) {
    console.log('[Cron]', JSON.stringify(logEntry));
  } else {
    console.error('[Cron Error]', JSON.stringify(logEntry));
  }
}
