// =====================================================
// API 응답 캐싱 헤더 유틸리티
// =====================================================

import { NextResponse } from 'next/server';

/**
 * 캐시 정책 타입
 */
export type CachePolicy =
  | 'no-store'           // 캐시 안함 (민감한 데이터)
  | 'private'            // 브라우저만 캐시 (사용자별 데이터)
  | 'public-short'       // 공개 캐시 1분 (실시간 데이터)
  | 'public-medium'      // 공개 캐시 5분 (준실시간 데이터)
  | 'public-long'        // 공개 캐시 1시간 (정적 데이터)
  | 'immutable';         // 영구 캐시 (변하지 않는 데이터)

/**
 * 캐시 헤더 설정값
 */
const CACHE_HEADERS: Record<CachePolicy, string> = {
  'no-store': 'no-store, no-cache, must-revalidate',
  'private': 'private, max-age=60, stale-while-revalidate=30',
  'public-short': 'public, max-age=60, stale-while-revalidate=30',
  'public-medium': 'public, max-age=300, stale-while-revalidate=60',
  'public-long': 'public, max-age=3600, stale-while-revalidate=300',
  'immutable': 'public, max-age=31536000, immutable',
};

/**
 * 캐시 헤더가 적용된 JSON 응답 생성
 */
export function jsonWithCache<T>(
  data: T,
  policy: CachePolicy = 'no-store',
  status: number = 200
): NextResponse<T> {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': CACHE_HEADERS[policy],
    },
  });
}

/**
 * API별 권장 캐시 정책
 *
 * - 사용자 데이터 (구독, 알림, 포트폴리오): 'no-store' 또는 'private'
 * - 실시간 주가: 'public-short' (1분)
 * - 오늘의 추천: 'public-medium' (5분)
 * - 히스토리/통계: 'public-long' (1시간)
 * - 정적 메타데이터: 'immutable'
 */

/**
 * 에러 응답 (캐시 안함)
 */
export function errorResponse(
  message: string,
  status: number = 500
): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    {
      status,
      headers: {
        'Cache-Control': CACHE_HEADERS['no-store'],
      },
    }
  );
}

/**
 * 조건부 캐싱 - ETag 기반
 */
export function withETag(
  data: object,
  policy: CachePolicy = 'public-medium'
): NextResponse {
  const json = JSON.stringify(data);
  const etag = `"${Buffer.from(json).toString('base64').slice(0, 27)}"`;

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': CACHE_HEADERS[policy],
      'ETag': etag,
    },
  });
}
