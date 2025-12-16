/**
 * 종목 코드 - 종목명 매핑
 * 전체 앱에서 일관된 종목명 표시를 위해 사용
 */

export const STOCK_NAMES: Record<string, string> = {
  // 반도체
  '005930': '삼성전자',
  '000660': 'SK하이닉스',
  
  // 2차전지
  '373220': 'LG에너지솔루션',
  '006400': '삼성SDI',
  '247540': '에코프로비엠',
  
  // 바이오
  '207940': '삼성바이오로직스',
  '068270': '셀트리온',
  
  // 자동차
  '005380': '현대차',
  '000270': '기아',
  '012330': '현대모비스',
  
  // IT서비스
  '035420': 'NAVER',
  '035720': '카카오',
  
  // 금융
  '105560': 'KB금융',
  '055550': '신한지주',
  '086790': '하나금융지주',
  
  // 통신
  '017670': 'SK텔레콤',
  '030200': 'KT',
  '032640': 'LG유플러스',
  
  // 화학
  '051910': 'LG화학',
  
  // 철강
  '005490': 'POSCO홀딩스',
  
  // 보험
  '032830': '삼성생명',
  
  // 지주회사
  '034730': 'SK',
  '003550': 'LG',
  
  // 유통
  '004170': '신세계',
};

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

