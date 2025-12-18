/**
 * 종목 코드 - 종목명 매핑
 * 전체 앱에서 일관된 종목명 표시를 위해 사용
 * 
 * Note: 기본 매핑은 KRX_ALL_STOCKS에서 가져오며,
 * 이 파일은 하위 호환성을 위해 유지됩니다.
 */

import { KRX_ALL_STOCKS } from './data/krx-stocks';

// Re-export KRX utilities for convenience
export { KRX_ALL_STOCKS, findStockBySymbol, searchStocksByName, KRX_SECTORS } from './data/krx-stocks';

// KRX 데이터에서 종목명 매핑 생성
export const STOCK_NAMES: Record<string, string> = Object.fromEntries(
  KRX_ALL_STOCKS.map(stock => [stock.symbol, stock.name])
);

/**
 * 종목 코드로 종목명 조회
 * @param symbol 종목 코드
 * @returns 종목명 (없으면 종목 코드 반환)
 */
export function getStockName(symbol: string): string {
  return STOCK_NAMES[symbol] || symbol;
}

/**
 * 종목 코드와 종목명을 함께 표시하는 형식으로 반환
 * @param symbol 종목 코드
 * @returns "종목명 (코드)" 형식
 */
export function formatStockWithCode(symbol: string): string {
  const name = STOCK_NAMES[symbol];
  if (name) {
    return `${name} (${symbol})`;
  }
  return symbol;
}

/**
 * 종목명만 반환 (코드가 없으면 코드 그대로)
 * @param symbol 종목 코드
 * @param fallbackName API에서 받은 이름 (옵션)
 * @returns 종목명
 */
export function getStockDisplayName(symbol: string, fallbackName?: string): string {
  // 1. 로컬 매핑에서 찾기
  if (STOCK_NAMES[symbol]) {
    return STOCK_NAMES[symbol];
  }
  
  // 2. fallbackName이 유효한 경우 (숫자로만 이루어지지 않은 경우)
  if (fallbackName && !/^\d+$/.test(fallbackName)) {
    return fallbackName;
  }
  
  // 3. 코드 그대로 반환
  return symbol;
}


