export type { MarketDataProvider, StockQuote, StockFinancials, StockNews } from './types';
export { MockMarketDataProvider, createMarketDataProvider as createMockMarketDataProvider } from './mock';
export { KISMarketDataProvider, createKISMarketDataProvider, fetchMultipleStockPrices } from './kis';
export { KiwoomMarketDataProvider, createKiwoomMarketDataProvider, fetchMultipleKiwoomPrices } from './kiwoom';
export { NaverMarketDataProvider, createNaverMarketDataProvider, fetchMultipleNaverPrices } from './naver';

// 자동으로 적절한 Provider 선택
// 우선순위: KIS API > Kiwoom API > Naver Finance
export function createMarketDataProvider() {
  const hasKISCredentials = !!(process.env.KIS_APP_KEY && process.env.KIS_APP_SECRET);
  const hasKiwoomCredentials = !!(process.env.KIWOOM_APP_KEY && process.env.KIWOOM_APP_SECRET);
  
  if (hasKISCredentials) {
    const { KISMarketDataProvider } = require('./kis');
    return new KISMarketDataProvider();
  }
  
  if (hasKiwoomCredentials) {
    const { KiwoomMarketDataProvider } = require('./kiwoom');
    return new KiwoomMarketDataProvider();
  }
  
  // 증권사 API 없으면 네이버 금융 사용 (실시간 무료)
  const { NaverMarketDataProvider } = require('./naver');
  return new NaverMarketDataProvider();
}

