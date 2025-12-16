'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CharacterAvatar } from './CharacterAvatar';
import { CHARACTERS } from '@/lib/characters';
import type { CharacterType } from '@/lib/types';

interface PortfolioItem {
  code: string;
  name: string;
  sector: string;
  weight: number;
  amount: number;
  shares: number;
  price: number;
  rationale: string;
  weightReason: string;
  riskFactors: string;
  targetReturn: string;
}

interface AIPortfolio {
  character: CharacterType;
  characterName: string;
  cashWeight: number;
  cashAmount: number;
  cashReason: string;
  holdings: PortfolioItem[];
  totalInvested: number;
  riskLevel: 'conservative' | 'balanced' | 'aggressive';
  strategy: string;
  strategyDetail: string;
}

interface GeneratedPortfolios {
  amount: number;
  generatedAt: string;
  portfolios: AIPortfolio[];
}

const RISK_COLORS = {
  conservative: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  balanced: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  aggressive: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
};

const RISK_LABELS = {
  conservative: '보수적',
  balanced: '균형',
  aggressive: '공격적',
};

function PortfolioCard({ portfolio, index }: { portfolio: AIPortfolio; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const char = CHARACTERS[portfolio.character];
  const risk = RISK_COLORS[portfolio.riskLevel];
  
  return (
    <div className={`rounded-2xl border transition-all ${
      expanded ? `${char.bgColor} border-current/20` : 'bg-dark-800/50 border-dark-700/50'
    }`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-4"
      >
        <CharacterAvatar character={portfolio.character} size="lg" />
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-dark-100">{portfolio.characterName}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${risk.bg} ${risk.text}`}>
              {RISK_LABELS[portfolio.riskLevel]}
            </span>
          </div>
          <div className="text-sm text-dark-500">{char.role}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-dark-100">
            {(portfolio.totalInvested + portfolio.cashAmount).toLocaleString()}원
          </div>
          <div className="text-xs text-dark-500">
            현금 {portfolio.cashWeight}%
          </div>
        </div>
        <svg 
          className={`w-5 h-5 text-dark-500 transition-transform ${expanded ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Strategy */}
          <div className="p-3 rounded-xl bg-dark-900/50 space-y-2">
            <div className="text-xs text-dark-500 font-medium">📊 투자 전략</div>
            <p className="text-sm text-dark-300 leading-relaxed">{portfolio.strategy}</p>
            {portfolio.strategyDetail && (
              <p className="text-xs text-dark-400 leading-relaxed border-t border-dark-700/50 pt-2 mt-2">
                {portfolio.strategyDetail}
              </p>
            )}
          </div>
          
          {/* Allocation Chart */}
          <div className="space-y-2">
            <div className="text-xs text-dark-500">포트폴리오 배분</div>
            <div className="h-4 rounded-full overflow-hidden flex bg-dark-900">
              {portfolio.holdings.map((holding, i) => (
                <div
                  key={holding.code}
                  className={`h-full transition-all ${
                    i === 0 ? 'bg-brand-500' :
                    i === 1 ? 'bg-emerald-500' :
                    i === 2 ? 'bg-amber-500' :
                    i === 3 ? 'bg-rose-500' :
                    'bg-violet-500'
                  }`}
                  style={{ width: `${holding.weight}%` }}
                  title={`${holding.name}: ${holding.weight}%`}
                />
              ))}
              <div
                className="h-full bg-dark-600"
                style={{ width: `${portfolio.cashWeight}%` }}
                title={`현금: ${portfolio.cashWeight}%`}
              />
            </div>
          </div>
          
          {/* Holdings Table */}
          <div className="space-y-3">
            <div className="text-xs text-dark-500 font-medium">📈 종목별 상세 분석</div>
            <div className="space-y-3">
              {portfolio.holdings.map((holding, i) => (
                <div
                  key={holding.code}
                  className="p-4 rounded-xl bg-dark-900/50 space-y-3"
                >
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0 ${
                      i === 0 ? 'bg-brand-500' :
                      i === 1 ? 'bg-emerald-500' :
                      i === 2 ? 'bg-amber-500' :
                      i === 3 ? 'bg-rose-500' :
                      'bg-violet-500'
                    }`}>
                      {holding.weight.toFixed(0)}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link 
                          href={`/battle/${holding.code}`}
                          className="font-semibold text-dark-100 hover:text-brand-400 transition-colors"
                        >
                          {holding.name}
                        </Link>
                        <span className="px-2 py-0.5 rounded-full bg-dark-700 text-xs text-dark-400">{holding.sector}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                          {holding.targetReturn || '+10~15%'}
                        </span>
                      </div>
                      <div className="text-xs text-dark-500 mt-1">
                        {holding.shares}주 × {holding.price.toLocaleString()}원 = <span className="text-dark-300 font-medium">{holding.amount.toLocaleString()}원</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Analysis Details */}
                  <div className="space-y-2 text-sm">
                    {/* Selection Reason */}
                    <div className="p-2.5 rounded-lg bg-dark-800/50">
                      <div className="flex items-center gap-1.5 text-xs text-brand-400 font-medium mb-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        선정 이유
                      </div>
                      <p className="text-dark-300 leading-relaxed">{holding.rationale}</p>
                    </div>
                    
                    {/* Weight Reason */}
                    {holding.weightReason && (
                      <div className="p-2.5 rounded-lg bg-dark-800/50">
                        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium mb-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                          </svg>
                          비중 결정 이유
                        </div>
                        <p className="text-dark-300 leading-relaxed">{holding.weightReason}</p>
                      </div>
                    )}
                    
                    {/* Risk Factors */}
                    {holding.riskFactors && (
                      <div className="p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/10">
                        <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium mb-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          리스크 요인
                        </div>
                        <p className="text-dark-400 leading-relaxed">{holding.riskFactors}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Cash */}
              <div className="p-4 rounded-xl bg-dark-900/50 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white bg-dark-600 shrink-0">
                    {portfolio.cashWeight.toFixed(0)}%
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-dark-300">현금 보유</div>
                    <div className="text-xs text-dark-500 mt-1">
                      <span className="text-dark-400 font-medium">{portfolio.cashAmount.toLocaleString()}원</span>
                    </div>
                  </div>
                </div>
                {portfolio.cashReason && (
                  <div className="p-2.5 rounded-lg bg-dark-800/50 mt-2">
                    <div className="flex items-center gap-1.5 text-xs text-dark-500 font-medium mb-1">
                      💵 현금 비중 이유
                    </div>
                    <p className="text-dark-400 text-sm leading-relaxed">{portfolio.cashReason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AIPortfolioSimulator() {
  const [amount, setAmount] = useState(10000000);
  const [isLoading, setIsLoading] = useState(false);
  const [portfolios, setPortfolios] = useState<GeneratedPortfolios | null>(null);
  
  const presets = [
    { value: 1000000, label: '100만원' },
    { value: 5000000, label: '500만원' },
    { value: 10000000, label: '1,000만원' },
    { value: 50000000, label: '5,000만원' },
    { value: 100000000, label: '1억원' },
  ];
  
  async function generatePortfolios() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/portfolio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (data.success) {
        setPortfolios(data.data);
      }
    } catch (error) {
      console.error('Failed to generate portfolios:', error);
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <div className="card">
      <h3 className="font-semibold text-dark-100 mb-2 flex items-center gap-2">
        <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        AI Portfolio Builder
      </h3>
      <p className="text-sm text-dark-500 mb-6">
        시드 금액을 설정하고 각 AI별 추천 포트폴리오를 생성해보세요
      </p>
      
      {/* Amount Selection */}
      <div className="mb-6">
        <label className="text-xs text-dark-500 block mb-2">Initial Investment</label>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => setAmount(preset.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                amount === preset.value
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
                  : 'bg-dark-800 text-dark-400 hover:text-dark-200 hover:bg-dark-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Generate Button */}
      <button
        onClick={generatePortfolios}
        disabled={isLoading}
        className="w-full btn-primary py-3 mb-6 disabled:opacity-50"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            3명의 AI가 포트폴리오 분석 중...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI 포트폴리오 만들기
          </span>
        )}
      </button>
      
      {/* Loading State with AI Characters */}
      {isLoading && (
        <div className="mb-6 p-4 rounded-xl bg-dark-800/50 border border-dark-700/50">
          <div className="flex items-center justify-center gap-4 mb-3">
            {(['claude', 'gemini', 'gpt'] as const).map((charId, i) => (
              <div 
                key={charId}
                className="animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              >
                <CharacterAvatar character={charId} size="md" />
              </div>
            ))}
          </div>
          <p className="text-sm text-dark-400 text-center">
            Claude, Gemini, GPT가 각자의 투자 철학으로<br />
            최적의 포트폴리오를 구성하고 있습니다...
          </p>
        </div>
      )}
      
      {/* Generated Portfolios */}
      {portfolios && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 text-xs font-medium flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI 생성
              </span>
              <span className="text-dark-500">
                투자금액: <span className="text-dark-200 font-semibold">{portfolios.amount.toLocaleString()}원</span>
              </span>
            </div>
            <span className="text-dark-600">
              {portfolios.generatedAt}
            </span>
          </div>
          
          {portfolios.portfolios.map((portfolio, i) => (
            <PortfolioCard key={portfolio.character} portfolio={portfolio} index={i} />
          ))}
          
          {/* Comparison Summary */}
          <div className="p-4 rounded-xl bg-dark-800/50 border border-dark-700/50">
            <h4 className="text-sm font-semibold text-dark-200 mb-3">Portfolio Comparison</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              {portfolios.portfolios.map((p) => {
                const char = CHARACTERS[p.character];
                return (
                  <div key={p.character}>
                    <div className={`text-xs ${char.color} mb-1`}>{p.characterName}</div>
                    <div className="text-lg font-bold text-dark-100">{p.cashWeight}%</div>
                    <div className="text-xs text-dark-500">현금 비중</div>
                    <div className="text-xs text-dark-600 mt-1">
                      {p.holdings.length}종목
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Disclaimer */}
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs text-dark-400">
                제시된 포트폴리오는 참고용이며 투자 권유가 아닙니다. 실제 투자 시 본인의 판단과 책임하에 결정하시기 바랍니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

