/**
 * 외부 API를 통한 주식 검색 서비스
 * 
 * 지원 소스:
 * - KRX KIND (한국거래소 공시 시스템)
 * - 네이버 금융 (실시간 시세)
 * - 한국투자증권 KIS API (백업)
 */

export interface ExternalStockResult {
  symbol: string;
  name: string;
  market: 'KOSPI' | 'KOSDAQ' | 'KONEX' | 'ETF' | 'OTHER';
  type: 'stock' | 'etf' | 'etn' | 'other';
  source: 'naver' | 'krx' | 'kis' | 'local';
  // 실시간 시세 정보 (있는 경우)
  price?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  marketCap?: number;
}

/**
 * 숫자 문자열 파싱 (콤마 제거)
 */
function parseNumberString(str: string | number | undefined): number {
  if (str === undefined || str === null) return 0;
  if (typeof str === 'number') return str;
  // 콤마, 공백 등 제거 후 숫자만 추출
  const cleaned = String(str).replace(/[,\s]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * 네이버 금융 주식 시세 조회
 * 종목코드로 실시간 시세 정보 가져오기
 */
export async function getNaverStockPrice(symbol: string): Promise<{
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  name: string;
  market: string;
} | null> {
  try {
    // 네이버 금융 API (시세 정보)
    const url = `https://m.stock.naver.com/api/stock/${symbol}/basic`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    // 시장 코드 매핑
    const marketCode = data.stockExchangeType?.code || 'KS';
    const market = marketCode === 'KQ' ? 'KOSDAQ' 
                 : marketCode === 'KN' ? 'KONEX' 
                 : 'KOSPI';
    
    return {
      price: parseNumberString(data.closePrice),
      change: parseNumberString(data.compareToPreviousClosePrice),
      changePercent: parseFloat(data.fluctuationsRatio) || 0,
      volume: parseNumberString(data.accumulatedTradingVolume),
      name: data.stockName || '',
      market,
    };
  } catch (error) {
    console.error('Naver price fetch error:', error);
    return null;
  }
}

/**
 * 네이버 금융 종목 검색 (모바일 API)
 */
export async function searchNaverFinance(query: string): Promise<ExternalStockResult[]> {
  if (!query || query.length < 1) {
    return [];
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://m.stock.naver.com/api/json/search/searchListJson.naver?keyword=${encodedQuery}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const items = data?.result?.d || [];
    
    return items.map((item: Record<string, string>) => {
      const marketType = item.stockExchangeType || '';
      const market = marketType === 'KOSDAQ' ? 'KOSDAQ' 
                   : marketType === 'KONEX' ? 'KONEX'
                   : 'KOSPI';
      
      return {
        symbol: item.itemCode || '',
        name: item.stockName || item.itemName || '',
        market: market as ExternalStockResult['market'],
        type: (item.reutersIndustryCode?.includes('ETF') ? 'etf' : 'stock') as ExternalStockResult['type'],
        source: 'naver' as const,
      };
    }).filter((r: ExternalStockResult) => r.symbol && r.name);
  } catch (error) {
    console.error('Naver search error:', error);
    return [];
  }
}

/**
 * KRX KIND 종목 검색 (한국거래소 공시 시스템)
 */
export async function searchKRXKind(query: string): Promise<ExternalStockResult[]> {
  if (!query || query.length < 1) {
    return [];
  }

  try {
    const url = `https://kind.krx.co.kr/disclosure/searchticker.do`;
    
    const formData = new URLSearchParams();
    formData.append('method', 'searchCodeByName');
    formData.append('searchCodeType', '');
    formData.append('searchCorpName', query);
    formData.append('marketType', 'ALL');
    formData.append('repIsuSrtCd', '');
    formData.append('isurCd', '');
    formData.append('fdName', 'finder_korstock');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Referer': 'https://kind.krx.co.kr/',
        'Accept': 'text/html, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      return [];
    }

    const html = await response.text();
    const results: ExternalStockResult[] = [];
    
    // HTML 파싱: onclick="parent.window.codeClick('종목코드','종목명','시장코드', ...)
    const regex = /onclick="parent\.window\.codeClick\('(\d{6})','([^']+)','([^']*)',/g;
    let match;

    while ((match = regex.exec(html)) !== null) {
      const symbol = match[1];
      const name = match[2];
      const marketCode = match[3] || '';
      
      let market: ExternalStockResult['market'] = 'KOSPI';
      if (marketCode.includes('Q') || marketCode.includes('KQ')) {
        market = 'KOSDAQ';
      } else if (marketCode.includes('N') || marketCode.includes('KN')) {
        market = 'KONEX';
      }
      
      results.push({
        symbol,
        name,
        market,
        type: 'stock',
        source: 'krx' as const,
      });
    }

    return results;
  } catch (error) {
    console.error('KRX KIND search error:', error);
    return [];
  }
}

/**
 * KRX 데이터 포털 종목 검색 (가장 안정적인 소스)
 */
export async function searchKRXStocks(query: string): Promise<ExternalStockResult[]> {
  if (!query || query.length < 1) {
    return [];
  }

  try {
    const url = `http://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd`;
    
    const formData = new URLSearchParams();
    formData.append('bld', 'dbms/comm/finder/finder_stkisu');
    formData.append('mktsel', 'ALL');
    formData.append('searchText', query);
    formData.append('typeNo', '0');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Referer': 'http://data.krx.co.kr/',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      console.error('KRX DATA API error:', response.status);
      return [];
    }

    const data = await response.json();
    const items = data?.block1 || [];

    console.log(`[KRX DATA] Found ${items.length} results for "${query}"`);

    return items.map((item: Record<string, string>) => {
      // 시장 코드 매핑
      const marketCode = item.marketCode || '';
      const market = marketCode === 'STK' ? 'KOSPI' 
                   : marketCode === 'KSQ' ? 'KOSDAQ' 
                   : marketCode === 'KNX' ? 'KONEX' 
                   : 'KOSPI';
      
      // 종목코드 (숫자 + 알파벳 모두 허용)
      const symbol = item.short_code || '';
      
      return {
        symbol,
        name: item.codeName || '',
        market: market as ExternalStockResult['market'],
        type: 'stock' as const,
        source: 'krx' as const,
      };
    }).filter((item: ExternalStockResult) => {
      // 6자리 종목코드 (숫자 또는 숫자+알파벳)
      return item.symbol && item.symbol.length === 6 && item.name;
    });
  } catch (error) {
    console.error('KRX DATA search error:', error);
    return [];
  }
}

/**
 * 통합 종목 검색 - 여러 소스에서 검색 후 병합
 * 우선순위: KRX DATA (가장 안정적) > KRX KIND > 네이버 금융
 */
export async function searchAllSources(query: string): Promise<ExternalStockResult[]> {
  if (!query || query.length < 1) {
    return [];
  }

  console.log(`[External Search] Searching for: "${query}"`);

  try {
    // 병렬로 여러 소스 검색
    const [krxDataResults, kindResults, naverResults] = await Promise.allSettled([
      searchKRXStocks(query),     // KRX DATA - 가장 안정적
      searchKRXKind(query),       // KRX KIND - 백업
      searchNaverFinance(query),  // 네이버 - 추가 데이터
    ]);

    // 결과 수집 (중복 제거)
    const allResults: ExternalStockResult[] = [];
    const seenSymbols = new Set<string>();

    // 각 소스에서 결과 추가 (중복 제거)
    const addResults = (results: ExternalStockResult[], sourceName: string) => {
      let added = 0;
      results.forEach(result => {
        // 6자리 종목코드 허용 (숫자 또는 숫자+알파벳)
        if (result.symbol && result.symbol.length === 6 && !seenSymbols.has(result.symbol)) {
          allResults.push(result);
          seenSymbols.add(result.symbol);
          added++;
        }
      });
      if (added > 0) {
        console.log(`[External Search] ${sourceName}: Added ${added} results`);
      }
    };

    // KRX DATA 결과 우선 (가장 안정적)
    if (krxDataResults.status === 'fulfilled' && krxDataResults.value.length > 0) {
      addResults(krxDataResults.value, 'KRX DATA');
    }

    // KRX KIND 결과 추가
    if (kindResults.status === 'fulfilled' && kindResults.value.length > 0) {
      addResults(kindResults.value, 'KRX KIND');
    }

    // 네이버 금융 결과 추가
    if (naverResults.status === 'fulfilled' && naverResults.value.length > 0) {
      addResults(naverResults.value, 'Naver');
    }

    console.log(`[External Search] Total unique results: ${allResults.length}`);
    return allResults;
  } catch (error) {
    console.error('[External Search] Error:', error);
    return [];
  }
}

/**
 * 종목 코드로 종목 정보 + 실시간 시세 조회
 */
export async function getStockInfoByCode(symbol: string): Promise<ExternalStockResult | null> {
  if (!symbol || !/^\d{6}$/.test(symbol)) {
    return null;
  }

  try {
    // 네이버 금융에서 실시간 시세 조회
    const priceInfo = await getNaverStockPrice(symbol);
    
    if (priceInfo && priceInfo.name) {
      return {
        symbol,
        name: priceInfo.name,
        market: priceInfo.market === 'KOSDAQ' ? 'KOSDAQ' : 'KOSPI',
        type: 'stock',
        source: 'naver',
        price: priceInfo.price,
        change: priceInfo.change,
        changePercent: priceInfo.changePercent,
        volume: priceInfo.volume,
      };
    }

    // 네이버 실패 시 검색 API로 fallback
    const searchResults = await searchAllSources(symbol);
    const exactMatch = searchResults.find(r => r.symbol === symbol);
    
    return exactMatch || searchResults[0] || null;
  } catch (error) {
    console.error('Get stock info error:', error);
    return null;
  }
}

/**
 * 여러 종목의 실시간 시세를 병렬로 조회
 */
export async function getMultipleStockPrices(symbols: string[]): Promise<Map<string, ExternalStockResult>> {
  const results = new Map<string, ExternalStockResult>();
  
  if (symbols.length === 0) {
    return results;
  }

  // 최대 10개까지만 병렬 조회 (API 부하 방지)
  const limitedSymbols = symbols.slice(0, 10);
  
  const pricePromises = limitedSymbols.map(async (symbol) => {
    try {
      const info = await getStockInfoByCode(symbol);
      if (info) {
        results.set(symbol, info);
      }
    } catch (error) {
      console.error(`Failed to get price for ${symbol}:`, error);
    }
  });

  await Promise.allSettled(pricePromises);
  
  return results;
}

/**
 * 검색 결과에 실시간 시세 정보 추가
 */
export async function enrichWithPrices(stocks: ExternalStockResult[]): Promise<ExternalStockResult[]> {
  if (stocks.length === 0) {
    return stocks;
  }

  // 상위 5개만 시세 조회 (성능 최적화)
  const topStocks = stocks.slice(0, 5);
  const remainingStocks = stocks.slice(5);

  const enrichedPromises = topStocks.map(async (stock) => {
    try {
      const priceInfo = await getNaverStockPrice(stock.symbol);
      if (priceInfo) {
        return {
          ...stock,
          price: priceInfo.price,
          change: priceInfo.change,
          changePercent: priceInfo.changePercent,
          volume: priceInfo.volume,
        };
      }
    } catch (error) {
      // 시세 조회 실패 시 원본 반환
    }
    return stock;
  });

  const enrichedTop = await Promise.all(enrichedPromises);
  
  return [...enrichedTop, ...remainingStocks];
}
