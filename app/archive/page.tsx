'use client';

import Link from 'next/link';
import { Header } from '@/components';
import { ArrowLeft, Construction } from 'lucide-react';

export default function ArchivePage() {
  return (
    <>
      <Header />
      <main className="container-app pt-24 pb-20">
        <div className="max-w-lg mx-auto text-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
            <Construction className="w-10 h-10 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-dark-50 mb-3">
            성과 아카이브 준비 중
          </h1>
          <p className="text-dark-400 mb-8 leading-relaxed">
            AI 추천 종목의 과거 적중률과 수익률을
            <br />
            분석하는 아카이브를 준비하고 있습니다.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-500 text-white font-medium text-sm hover:bg-brand-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            홈으로 돌아가기
          </Link>
        </div>
      </main>
    </>
  );
}
