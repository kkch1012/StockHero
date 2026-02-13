'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DisclaimerBar, Header, CharacterAvatarGroup } from '@/components';

interface AnalysisReport {
  id: string;
  symbol: string;
  symbol_name: string;
  tier: string;
  analysis_type: string;
  consensus_grade: string | null;
  consensus_confidence: number | null;
  consensus_price: number | null;
  used_ais: string[] | null;
  result: Record<string, unknown> | null;
  created_at: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getGradeBadge(grade: string | null) {
  switch (grade) {
    case 'STRONG':
      return { label: 'STRONG', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    case 'MODERATE':
      return { label: 'MODERATE', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    case 'CONFLICT':
      return { label: 'CONFLICT', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
    default:
      return { label: 'SINGLE', color: 'bg-brand-500/10 text-brand-400 border-brand-500/20' };
  }
}

function extractSummary(result: Record<string, unknown> | null): string {
  if (!result) return '';

  // result_summary가 있는 경우
  if (typeof result.result_summary === 'string') return result.result_summary;

  // analyses 배열이 있는 경우 (교차검증 결과)
  const analyses = result.analyses as Array<{ provider?: string; analysis?: string; summary?: string }> | undefined;
  if (Array.isArray(analyses)) {
    return analyses
      .map((a) => {
        const provider = (a.provider || '').toUpperCase();
        const text = a.summary || a.analysis || '';
        return `[${provider}] ${typeof text === 'string' ? text.slice(0, 300) : ''}`;
      })
      .join('\n\n');
  }

  // 단일 분석 결과
  if (typeof result.analysis === 'string') return result.analysis;
  if (typeof result.summary === 'string') return result.summary;

  return JSON.stringify(result, null, 2).slice(0, 500);
}

export default function ReportPage() {
  const params = useParams();
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/report/${params.id}`);
        const data = await res.json();
        if (data.success) {
          setReport(data.data);
        } else {
          setError(data.error || '리포트를 찾을 수 없습니다.');
        }
      } catch {
        setError('리포트를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchReport();
    }
  }, [params.id]);

  if (loading) {
    return (
      <>
        <DisclaimerBar />
        <Header />
        <main className="min-h-screen bg-dark-950 pt-32 pb-16">
          <div className="container-narrow">
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error || !report) {
    return (
      <>
        <DisclaimerBar />
        <Header />
        <main className="min-h-screen bg-dark-950 pt-32 pb-16">
          <div className="container-narrow">
            <div className="card text-center py-16">
              <svg className="w-16 h-16 text-dark-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-dark-300 mb-2">{error || '리포트를 찾을 수 없습니다'}</h3>
              <p className="text-dark-500 mb-6">분석 이력에서 리포트를 확인해주세요.</p>
              <Link href="/mypage" className="btn-primary">
                분석 이력 보기
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  const grade = getGradeBadge(report.consensus_grade);
  const usedAiLabels = (report.used_ais || []).map(ai => ai.charAt(0).toUpperCase() + ai.slice(1)).join(', ');
  const summary = extractSummary(report.result);

  return (
    <>
      <DisclaimerBar />
      <Header />
      <main className="min-h-screen bg-dark-950 pt-32 pb-16">
        <div className="container-narrow">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-dark-500 mb-8">
            <Link href="/mypage" className="hover:text-dark-300 transition-colors">마이페이지</Link>
            <span>/</span>
            <span className="text-dark-300">분석 리포트</span>
          </div>

          {/* Report Header */}
          <div className="card mb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`badge ${grade.color}`}>{grade.label}</span>
                  <span className="text-sm text-dark-500">{formatDate(report.created_at)}</span>
                </div>
                <h1 className="text-2xl font-bold text-dark-50 mb-2">
                  {report.symbol_name} AI 분석 리포트
                </h1>
                <div className="flex items-center gap-2 text-dark-400">
                  <span className="font-mono">{report.symbol}</span>
                  <span className="text-dark-600">|</span>
                  <span className="capitalize">{report.analysis_type.replace('_', ' ')}</span>
                  {report.consensus_confidence != null && (
                    <>
                      <span className="text-dark-600">|</span>
                      <span>신뢰도 {report.consensus_confidence}%</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* AI Authors */}
            {report.used_ais && report.used_ais.length > 0 && (
              <div className="flex items-center gap-4 pt-6 border-t border-dark-800">
                <div className="text-sm text-dark-500">Analyzed by:</div>
                <CharacterAvatarGroup size="md" overlap />
                <div className="text-sm text-dark-400">{usedAiLabels}</div>
              </div>
            )}
          </div>

          {/* Consensus Price */}
          {report.consensus_price != null && (
            <div className="card mb-8 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-600/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-dark-500">AI 합의 목표가</div>
                <div className="text-2xl font-bold text-dark-50">
                  {report.consensus_price.toLocaleString()}원
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="card">
            <h2 className="text-lg font-semibold text-dark-100 mb-4">분석 내용</h2>
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-dark-300 leading-relaxed">
                {summary || '상세 분석 내용이 없습니다.'}
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-8 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h4 className="font-medium text-amber-400 text-sm mb-1">투자 면책조항</h4>
                <p className="text-xs text-dark-400 leading-relaxed">
                  이 리포트는 AI 분석에 기반한 엔터테인먼트 콘텐츠입니다. 투자 조언이 아니며,
                  투자 결정의 책임은 전적으로 이용자 본인에게 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <DisclaimerBar variant="bottom" compact />
    </>
  );
}
