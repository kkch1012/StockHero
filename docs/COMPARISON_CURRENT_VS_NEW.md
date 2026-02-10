# StockHero: 현재 vs 새로운 콘셉트 비교

## 📊 핵심 차이점 요약

| 항목 | 현재 시스템 | 새로운 콘셉트 (3 AI 교차검증) |
|------|------------|--------------------------|
| **AI 사용 방식** | 토론 (Debate) - AI들이 대화하며 의견 교환 | 독립 분석 + 교차검증 - 각 AI가 따로 분석 후 교차검증 |
| **AI 역할** | 페르소나 기반 (균형/혁신/매크로) | 기능 기반 (펀더멘탈/트렌드/심리) |
| **출력 형식** | 토론 내용 (대화체) | 구조화된 리포트 (합의 등급 표시) |
| **핵심 가치** | "AI 토론을 통한 종목 분석" | "3 AI 교차검증을 통한 신뢰도" |
| **구독 차별화** | 기능 횟수 (Top 5, 상담 횟수) | **AI 개수** (1개 → 2개 → 3개) |
| **가격대** | ₩9,900 / ₩29,900 / ₩79,900 | ₩4,900 / ₩14,900 / ₩39,900 |

---

## 🎯 1. AI 시스템 비교

### 현재: 토론 (Debate) 방식
```
┌──────────────────────────────────────────┐
│         삼성전자 AI 토론              │
├──────────────────────────────────────────┤
│ Round 1                                  │
│ 🔵 Claude: "재무제표를 보면..."          │
│ 🟢 Gemini: "Claude님 의견에 동의..."     │
│ 🟣 GPT: "두 분 의견에 더해..."          │
│                                          │
│ Round 2                                  │
│ 🔵 Claude: "Gemini님이 말씀하신..."      │
│ ...                                      │
└──────────────────────────────────────────┘
```

**특징**:
- AI들이 **서로의 의견을 참조**하며 대화
- 4라운드 진행 (순차적)
- 대화체로 출력
- 최종 합의 도출 (consensus)

### 새로운: 독립 분석 + 교차검증
```
┌──────────────────────────────────────────┐
│         삼성전자 3 AI 분석            │
├──────────────────────────────────────────┤
│ 신뢰도: 🟢 STRONG (3/3 합의)            │
├──────────────────────────────────────────┤
│ 🔵 Claude (펀더멘탈)        ▲ 긍정     │
│ "영업이익 컨센서스 대비 12% 상회..."     │
│                                          │
│ 🟢 Gemini (데이터/트렌드)   ▲ 긍정     │
│ "외국인 순매수 2,300억 전환..."          │
│                                          │
│ 🟣 GPT (시장심리)           ▲ 긍정     │
│ "시나리오 분석: 상승 65%..."             │
├──────────────────────────────────────────┤
│ ⚡ 교차검증 결과                          │
│ ✅ 합의: HBM 성장 (3/3)                 │
│ ✅ 합의: 단기 수급 개선 (3/3)            │
└──────────────────────────────────────────┘
```

**특징**:
- 각 AI가 **독립적으로 분석** (병렬 처리)
- 구조화된 리포트
- 합의 등급 (STRONG/MODERATE/CONFLICT)
- 교차검증 엔진이 일치점/불일치점 추출

---

## 💰 2. 구독 시스템 비교

### 현재 구독 플랜

| 등급 | 가격 | 주요 기능 |
|------|------|----------|
| **Free** | ₩0 | Top 5 (한국) 1회/일, AI 상담 3회/일 |
| **Basic** | ₩9,900 | Top 5 무제한, AI 상담 10회/일 |
| **Pro** | ₩29,900 | 실시간 시그널, AI 상담 50회/일 |
| **VIP** | ₩79,900 | VIP 종목, AI 상담 무제한 |

**차별화 방식**: 기능 횟수 제한

---

### 새로운 구독 플랜 (AI 개수 차별화)

| 등급 | 가격 | AI 개수 | 주요 기능 |
|------|------|---------|----------|
| **Free** | ₩0 | **1개** (Gemini만) | 간단 분석, 신뢰도 없음 |
| **Lite** | ₩4,900 | **2개** (Gemini + Claude) | 2개 비교, 낮은 신뢰도 |
| **Basic** | ₩14,900 | **3개** (전체) | 교차검증, 합의 등급 표시 |
| **Pro** | ₩39,900 | **3개** + 상세 | 상세 시나리오, 목표가, VIP 종목 |

**차별화 방식**: **AI 개수** (핵심 마케팅 포인트!)

---

## 🔧 3. 기술 구현 차이

### 현재: 순차적 토론 (Sequential)
```typescript
// lib/llm/orchestrator.ts
async generateRound(symbol, symbolName, round) {
  for (const character of ['claude', 'gemini', 'gpt']) {
    // 순차 실행: Claude → Gemini → GPT
    const context = {
      previousMessages: [...this.previousMessages, ...messages]
      // 이전 AI들의 메시지를 다음 AI가 참조
    };
    const response = await adapter.generateStructured(context);
    messages.push(response);
  }
}
```

**문제점**:
- 순차 실행으로 느림 (3 AI × 4 라운드 = 12번 API 호출)
- AI들이 서로 영향을 주므로 독립성 부족

### 새로운: 병렬 분석 + 교차검증 (Parallel)
```typescript
async function tripleAnalysis(ticker: string) {
  // 1단계: 3개 AI 동시 호출 (병렬)
  const [claudeResult, geminiResult, gptResult] = await Promise.all([
    call_claude({ role: "펀더멘탈", data: financials }),
    call_gemini({ role: "트렌드", data: realtime }),
    call_gpt({ role: "심리", data: sentiment })
  ]);

  // 2단계: 교차검증 (StockHero 자체 엔진)
  const consensus = cross_validate([
    claudeResult, geminiResult, gptResult
  ]);

  return generateReport({ results, consensus });
}
```

**장점**:
- 병렬 실행으로 빠름 (3번만 API 호출)
- AI들이 독립적으로 분석 → 진짜 교차검증
- 캐싱 용이

---

## 🎨 4. UX/UI 차이

### 현재: 대화형 토론 보기
```
[실시간 스트리밍]
Round 1/4 진행 중...
💬 Claude: "삼성전자는 HBM 사업이..."
💬 Gemini: "Claude님 의견에 추가로..."
💬 GPT: "두 분 의견을 종합하면..."
```

- 유저가 토론을 "지켜보는" 느낌
- 엔터테인먼트 요소 강함
- 긴 시간 소요 (4라운드)

### 새로운: 신뢰도 등급 + 리포트
```
[즉시 결과]
📊 삼성전자 AI 분석
신뢰도: 🟢 STRONG (만장일치)

[각 AI 의견 요약]
[교차검증 결과]
[상세 리포트] (Pro 전용)
```

- 유저가 "결과"를 즉시 확인
- 신뢰도 등급으로 의사결정 도움
- 빠른 확인 가능

---

## 📈 5. 마케팅 메시지 차이

### 현재
> "3명의 AI 전문가가 실시간으로 토론합니다"
> "AI들의 열띤 논쟁을 지켜보세요"

**강조점**: 과정, 엔터테인먼트

### 새로운
> "AI 하나가 아니라 **세 개가 교차검증**합니다"
> "3개 AI가 모두 동의하면 🟢 STRONG 신뢰도"
> "의견이 갈리면 🔴 CONFLICT - 지금은 보류"

**강조점**: 신뢰성, 검증, 의사결정 도움

---

## 🔄 6. 데이터베이스 스키마 변경 필요 사항

### 현재 스키마
```sql
debate_sessions (토론 세션)
debate_messages (토론 메시지 - 라운드별)
verdicts (일일 Top 5)
```

### 새로운 스키마 (추가 필요)
```sql
-- 분석 리포트 테이블
analysis_reports (
  id, symbol_code, date,
  consensus_grade ENUM('STRONG', 'MODERATE', 'CONFLICT'),
  consensus_direction ENUM('UP', 'DOWN', 'NEUTRAL'),
  consensus_confidence INTEGER, -- 0-100
  created_at
)

-- 개별 AI 분석 테이블
ai_analyses (
  id, report_id,
  ai_type ENUM('claude', 'gemini', 'gpt'),
  role ENUM('fundamental', 'trend', 'sentiment'),
  direction ENUM('UP', 'DOWN', 'NEUTRAL'),
  score INTEGER, -- 1-5
  key_reasons JSONB,
  target_price INTEGER,
  created_at
)

-- 교차검증 결과 테이블
cross_validation_results (
  id, report_id,
  agreed_points JSONB, -- 3개 AI가 동의한 포인트
  conflict_points JSONB, -- 불일치 포인트
  unique_insights JSONB, -- 1개 AI만 언급한 인사이트
  created_at
)
```

---

## ✅ 7. 마이그레이션 로드맵

### Phase 1: 기능 추가 (기존 유지하며 신규 추가)
- [ ] 새로운 분석 엔진 개발 (`lib/llm/cross-validation.ts`)
- [ ] 교차검증 로직 구현
- [ ] 새로운 DB 테이블 추가
- [ ] 새로운 API 엔드포인트 (`/api/analysis/cross-validate`)
- **기존 토론 기능 유지** (병행 운영)

### Phase 2: UI 변경
- [ ] 신뢰도 등급 표시 컴포넌트
- [ ] 리포트 형식 UI
- [ ] 티어별 AI 개수 표시

### Phase 3: 구독 플랜 변경
- [ ] Lite 플랜 추가 (₩4,900)
- [ ] 가격 조정 (Basic ₩9,900 → ₩14,900)
- [ ] 기존 유저 마이그레이션 정책

### Phase 4: 기존 기능 단계적 제거
- [ ] 토론 기능을 "클래식 모드"로 전환
- [ ] 신규 유저는 교차검증만 노출
- [ ] 기존 유저에게 선택권 제공

---

## 🎯 최종 권장사항

### 옵션 A: 완전 전환 (Breaking Change)
**장점**: 깔끔한 재구성, 마케팅 메시지 명확
**단점**: 기존 유저 혼란, 개발 기간 길어짐

### 옵션 B: 병행 운영 (추천!)
**장점**: 리스크 최소화, A/B 테스트 가능
**단점**: 코드 복잡도 증가

**제안**:
1. 새로운 교차검증 기능을 **"프리미엄 분석"**으로 추가
2. 기존 토론은 **"클래식 토론"**으로 유지
3. Pro/VIP 유저에게 먼저 공개
4. 반응 좋으면 점진적으로 전환

---

## 💡 즉시 수정 가능한 부분

현재 시스템을 최소한으로 수정해서 교차검증 느낌을 낼 수 있는 방법:

### 1. 합의 등급 추가 (코드 수정 최소)
```typescript
// lib/llm/analysis-framework.ts 의 deriveConsensus 확장
export function getConsensusGrade(consensus: ConsensusResult) {
  const { agreement } = consensus;
  if (agreement >= 0.9) return 'STRONG';
  if (agreement >= 0.6) return 'MODERATE';
  return 'CONFLICT';
}
```

### 2. AI 역할 명시 (프롬프트 수정만)
- Claude 프롬프트에 "당신은 펀더멘탈 분석 전문가입니다" 추가
- Gemini 프롬프트에 "당신은 데이터 트렌드 분석가입니다" 추가
- GPT 프롬프트에 "당신은 시장 심리 분석가입니다" 추가

### 3. UI에 신뢰도 배지 추가
```tsx
{consensus && (
  <ConsensusBadge grade={getConsensusGrade(consensus)} />
)}
```

이렇게 하면 **큰 변경 없이** 교차검증 느낌을 줄 수 있습니다.
