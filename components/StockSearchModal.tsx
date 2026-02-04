'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Stock {
  symbol: string;
  name: string;
  sector: string;
  market?: 'KOSPI' | 'KOSDAQ';
  price?: number;
  change?: number;
  changePercent?: number;
  source?: 'local' | 'kis' | 'external';
  externalType?: 'stock' | 'etf' | 'etn' | 'other';
}

interface SearchResponse {
  success: boolean;
  results: Stock[];
  sectors: string[];
  total: number;
  hasMore?: boolean;
  sources?: {
    local: number;
    external: number;
  };
}

interface StockSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSymbol?: string;
  onSelect?: (stock: { symbol: string; name: string; sector: string }) => void;
}

export function StockSearchModal({ isOpen, onClose, currentSymbol, onSelect }: StockSearchModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<'KOSPI' | 'KOSDAQ' | null>(null);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 종목 검색 API 호출
  const searchStocks = useCallback(async (query: string, sector: string | null, market: string | null) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (sector) params.set('sector', sector);
      if (market) params.set('market', market);
      params.set('limit', '100');
      // 검색어가 있을 때만 실시간 가격 조회 (성능 최적화)
      if (query && query.length >= 2) {
        params.set('includePrice', 'true');
      }

      const response = await fetch(`/api/stocks/search?${params.toString()}`);
      const data: SearchResponse = await response.json();

      if (data.success) {
        setStocks(data.results);
        setSectors(data.sectors);
      }
    } catch (error) {
      console.error('Stock search failed:', error);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    if (isOpen && isInitialLoad) {
      searchStocks('', null, null);
    }
  }, [isOpen, isInitialLoad, searchStocks]);

  // 디바운스된 검색
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchStocks(searchQuery, selectedSector, selectedMarket);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, selectedSector, selectedMarket, searchStocks]);

  // 모달 열릴 때 input focus
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    // 모달 닫힐 때 상태 리셋
    if (!isOpen) {
      setSearchQuery('');
      setSelectedSector(null);
      setSelectedMarket(null);
      setIsInitialLoad(true);
    }
  }, [isOpen]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSelectStock = (stock: Stock) => {
    if (onSelect) {
      // 콜백이 제공되면 콜백 호출
      onSelect({
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector,
      });
    } else {
      // 콜백이 없으면 배틀 페이지로 이동
      if (stock.symbol !== currentSymbol) {
        router.push(`/battle/${stock.symbol}`);
      }
    }
    onClose();
  };

  // 가격 변동 색상
  const getPriceChangeColor = (change?: number) => {
    if (!change) return 'text-dark-400';
    if (change > 0) return 'text-red-400';
    if (change < 0) return 'text-blue-400';
    return 'text-dark-400';
  };

  // 가격 포맷
  const formatPrice = (price?: number) => {
    if (!price) return '-';
    return price.toLocaleString() + '원';
  };

  // 변동률 포맷
  const formatChange = (change?: number, changePercent?: number) => {
    if (change === undefined || change === null) return '';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toLocaleString()} (${sign}${changePercent?.toFixed(2)}%)`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        className="relative w-full max-w-3xl bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl overflow-hidden animate-fade-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-search-modal-title"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-dark-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 id="stock-search-modal-title" className="text-xl font-bold text-white">종목 검색</h2>
              <p className="text-xs text-dark-500 mt-1">KOSPI/KOSDAQ 전 종목 검색 가능</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
              aria-label="닫기"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Search Input */}
          <div className="relative">
            <svg 
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="종목명 또는 종목코드 검색 (예: 삼성전자, 005930)"
              className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
            {isLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          
          {/* Market Filter */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setSelectedMarket(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !selectedMarket 
                  ? 'bg-brand-500 text-white' 
                  : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setSelectedMarket(selectedMarket === 'KOSPI' ? null : 'KOSPI')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedMarket === 'KOSPI' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
              }`}
            >
              KOSPI
            </button>
            <button
              onClick={() => setSelectedMarket(selectedMarket === 'KOSDAQ' ? null : 'KOSDAQ')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedMarket === 'KOSDAQ' 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
              }`}
            >
              KOSDAQ
            </button>
          </div>
          
          {/* Sector Filter */}
          <div className="flex flex-wrap gap-2 mt-3 max-h-[80px] overflow-y-auto">
            <button
              onClick={() => setSelectedSector(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !selectedSector 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
              }`}
            >
              전체 업종
            </button>
            {sectors.slice(0, 20).map(sector => (
              <button
                key={sector}
                onClick={() => setSelectedSector(selectedSector === sector ? null : sector)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedSector === sector 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
                }`}
              >
                {sector}
              </button>
            ))}
          </div>
        </div>
        
        {/* Stock List */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {isLoading && isInitialLoad ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 mx-auto mb-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-dark-400">종목을 불러오는 중...</p>
            </div>
          ) : stocks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {stocks.map(stock => (
                <button
                  key={stock.symbol}
                  onClick={() => handleSelectStock(stock)}
                  className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl text-left transition-all ${
                    stock.symbol === currentSymbol
                      ? 'bg-brand-500/20 border border-brand-500/50'
                      : 'bg-dark-800/50 border border-transparent hover:bg-dark-800 hover:border-dark-700'
                  }`}
                >
                  {/* Stock Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    stock.market === 'KOSDAQ' 
                      ? 'bg-gradient-to-br from-purple-500/20 to-purple-600/20' 
                      : 'bg-gradient-to-br from-blue-500/20 to-blue-600/20'
                  }`}>
                    <span className={`font-bold text-sm ${
                      stock.market === 'KOSDAQ' ? 'text-purple-400' : 'text-blue-400'
                    }`}>
                      {stock.name.charAt(0)}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white truncate">{stock.name}</span>
                      {stock.symbol === currentSymbol && (
                        <span className="px-1.5 py-0.5 bg-brand-500 rounded text-[10px] font-bold text-white flex-shrink-0">현재</span>
                      )}
                      {stock.source === 'external' && (
                        <span className="px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded text-[10px] font-bold text-amber-400 flex-shrink-0">
                          네이버
                        </span>
                      )}
                      {stock.source === 'kis' && (
                        <span className="px-1.5 py-0.5 bg-green-500/20 border border-green-500/30 rounded text-[10px] font-bold text-green-400 flex-shrink-0">실시간</span>
                      )}
                      {stock.externalType === 'etf' && (
                        <span className="px-1.5 py-0.5 bg-cyan-500/20 border border-cyan-500/30 rounded text-[10px] font-bold text-cyan-400 flex-shrink-0">ETF</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <span className="text-dark-500">{stock.symbol}</span>
                      <span className="text-dark-600">•</span>
                      <span className={`${stock.market === 'KOSDAQ' ? 'text-purple-400' : 'text-blue-400'}`}>
                        {stock.market}
                      </span>
                      {stock.sector && stock.sector !== '외부검색' && (
                        <>
                          <span className="text-dark-600">•</span>
                          <span className="text-dark-400 truncate">{stock.sector}</span>
                        </>
                      )}
                    </div>
                    {/* 실시간 가격 */}
                    {stock.price && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-medium text-white">{formatPrice(stock.price)}</span>
                        <span className={`text-xs ${getPriceChangeColor(stock.change)}`}>
                          {formatChange(stock.change, stock.changePercent)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Arrow */}
                  <svg 
                    className="w-5 h-5 text-dark-600 flex-shrink-0" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-dark-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-dark-400">검색 결과가 없습니다</p>
              <p className="text-sm text-dark-500 mt-1">
                {searchQuery.length === 6 && /^\d+$/.test(searchQuery) 
                  ? '종목코드로 KIS API에서 조회 중입니다...'
                  : '다른 검색어를 입력해 주세요'}
              </p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-dark-800 bg-dark-900/80">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-dark-500">
              <span>총 {stocks.length}개 종목</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  KOSPI
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  KOSDAQ
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  외부검색
                </span>
              </div>
            </div>
            {searchQuery.length >= 2 && stocks.some(s => s.source === 'external') && (
              <p className="text-[10px] text-amber-500/70 text-center">
                💡 네이버 금융에서 추가 종목을 검색했습니다
              </p>
            )}
            {searchQuery.length >= 2 && stocks.length === 0 && !isLoading && (
              <p className="text-[10px] text-dark-500 text-center">
                💡 6자리 종목코드를 직접 입력하면 전체 상장종목을 검색할 수 있습니다
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
