/**
 * AI 통합 테스트 스크립트 (인증 우회, AI 호출만 검증)
 * 실행: npx tsx scripts/test-ai.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// .env.local 수동 로드 (Next.js 외부에서 실행하므로, import 전에 반드시 실행)
const envPath = resolve(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const value = trimmed.slice(eqIdx + 1).trim();
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

// 환경변수 검증
const requiredKeys = ['GOOGLE_AI_API_KEY', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY'];
for (const key of requiredKeys) {
  if (!process.env[key] || process.env[key]!.startsWith('your-')) {
    console.error(`❌ 환경변수 누락: ${key}`);
    process.exit(1);
  }
}
console.log('✅ 환경변수 로드 완료 (3개 AI 키 확인)');

const TEST_STOCK = {
  symbol: '005930',
  symbolName: '삼성전자',
  currentPrice: 55000,
  sector: '반도체',
};

async function testTier(tier: 'free' | 'lite' | 'basic') {
  // 동적 import (환경변수 로드 후)
  const { performTierBasedAnalysis } = await import('../lib/llm/tier-based-analysis');

  const label = { free: 'Free (Gemini)', lite: 'Lite (Gemini+Claude)', basic: 'Basic (3 AI 교차검증)' }[tier];
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 ${label} 테스트 시작`);
  console.log(`${'='.repeat(60)}`);

  const start = Date.now();
  try {
    const result = await performTierBasedAnalysis(
      tier,
      TEST_STOCK.symbol,
      TEST_STOCK.symbolName,
      TEST_STOCK.currentPrice,
      { sector: TEST_STOCK.sector }
    );

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`✅ ${label} 성공 (${elapsed}초)`);
    console.log(`   분석 타입: ${result.analysisType}`);
    console.log(`   사용 AI: ${result.usedAIs.join(', ')}`);
    console.log(`   API 비용: ₩${result.apiCost}`);

    if (result.analysisType === 'single') {
      const r = result.result;
      console.log(`   점수: ${r.analysis.score}/5`);
      console.log(`   목표가: ₩${r.analysis.targetPrice?.toLocaleString() || 'N/A'}`);
      console.log(`   내용: ${r.analysis.content.slice(0, 100)}...`);
    } else if (result.analysisType === 'comparison') {
      const r = result.result;
      console.log(`   방향 일치: ${r.comparison.directionMatch}`);
      console.log(`   가격차: ${r.comparison.priceDifferencePercent.toFixed(1)}%`);
      console.log(`   Gemini 점수: ${r.analyses.gemini.score}, Claude 점수: ${r.analyses.claude.score}`);
    } else if (result.analysisType === 'cross_validation') {
      const r = result.result;
      console.log(`   합의 등급: ${r.consensusGrade || 'N/A'}`);
      console.log(`   신뢰도: ${r.consensusConfidence || 'N/A'}%`);
      console.log(`   방향 합의: ${r.directionAgreement?.majorityDirection || 'N/A'}`);
      console.log(`   투표: UP=${r.directionAgreement?.votes?.UP}, DOWN=${r.directionAgreement?.votes?.DOWN}, NEUTRAL=${r.directionAgreement?.votes?.NEUTRAL}`);
      console.log(`   목표가 합의: ₩${r.priceAgreement?.consensus?.toLocaleString() || 'N/A'} (편차 ${r.priceAgreement?.spread?.toFixed(1)}%)`);
      console.log(`   추천: ${r.recommendation || 'N/A'}`);
    }

    return true;
  } catch (error: any) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`❌ ${label} 실패 (${elapsed}초)`);
    console.log(`   에러: ${error.message}`);
    if (error.status) console.log(`   HTTP 상태: ${error.status}`);
    return false;
  }
}

async function main() {
  console.log('🚀 StockHero AI 통합 테스트');
  console.log(`   종목: ${TEST_STOCK.symbolName} (${TEST_STOCK.symbol})`);
  console.log(`   현재가: ₩${TEST_STOCK.currentPrice.toLocaleString()}`);

  const results = {
    free: await testTier('free'),
    lite: await testTier('lite'),
    basic: await testTier('basic'),
  };

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 테스트 결과 요약');
  console.log(`${'='.repeat(60)}`);
  console.log(`   Free  (Gemini):     ${results.free ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Lite  (2 AI 비교):  ${results.lite ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Basic (3 AI 교차):  ${results.basic ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = Object.values(results).every(Boolean);
  console.log(`\n${allPassed ? '🎉 전체 테스트 통과!' : '⚠️ 일부 테스트 실패'}`);
  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
