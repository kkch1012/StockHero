// =====================================================
// IP 기반 Rate Limiting (브루트포스/남용 방지)
// 메모리 기반 간단한 rate limiter (Vercel Edge 호환)
//
// 참고: 플랜별 사용량 제한은 lib/rate-limiter.ts 참조
// 이 파일은 IP 기반 요청 제한 (인증 전 보호)
// =====================================================

interface RateLimitConfig {
  interval: number;  // 시간 윈도우 (ms)
  limit: number;     // 최대 요청 수
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// 메모리 저장소 (서버리스 환경에서는 요청 간 공유 안됨)
// 프로덕션에서는 Redis/Upstash 사용 권장
const rateLimitStore = new Map<string, RateLimitEntry>();

// 오래된 엔트리 정리 (메모리 누수 방지)
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60000; // 1분마다 정리

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  rateLimitStore.forEach((entry, key) => {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  });
}

/**
 * Rate Limit 체크
 * @returns { success: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { interval: 60000, limit: 60 }
): { success: boolean; remaining: number; resetAt: number } {
  cleanup();

  const now = Date.now();
  const key = identifier;
  const entry = rateLimitStore.get(key);

  // 새 윈도우 시작
  if (!entry || entry.resetAt < now) {
    const resetAt = now + config.interval;
    rateLimitStore.set(key, { count: 1, resetAt });
    return { success: true, remaining: config.limit - 1, resetAt };
  }

  // 기존 윈도우
  if (entry.count >= config.limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { success: true, remaining: config.limit - entry.count, resetAt: entry.resetAt };
}

/**
 * API별 Rate Limit 설정
 */
export const RATE_LIMITS = {
  // 일반 API - 분당 60회
  default: { interval: 60000, limit: 60 },

  // AI 채팅 - 분당 10회 (비용 높음)
  aiChat: { interval: 60000, limit: 10 },

  // 검색 - 분당 30회
  search: { interval: 60000, limit: 30 },

  // 결제 - 분당 5회
  payment: { interval: 60000, limit: 5 },

  // 인증 - 분당 10회 (브루트포스 방지)
  auth: { interval: 60000, limit: 10 },
} as const;

/**
 * Rate Limit 헤더 생성
 */
export function rateLimitHeaders(result: { remaining: number; resetAt: number }): HeadersInit {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
}

/**
 * IP 주소 추출 (Vercel/Cloudflare 호환)
 */
export function getClientIP(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}
