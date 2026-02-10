# 🎯 StockHero 구독 시스템 설계서

## 📊 수익성 중심 4단계 구독 모델

### 핵심 철학
> "Basic이 캐시카우, Pro는 사용량 캡으로 수익성 보호"

---

## 💎 구독 플랜 구조

### 1. Free (미끼 상품)
```yaml
가격: ₩0
API 비용: ₩63/월
마진: - (손실)
목적: 퍼널 진입
```

**제공 기능**:
- ✅ 1개 AI 분석 (Gemini만)
- ✅ Top 1 추천만 보임
- ✅ 당일 결과만
- ❌ 교차검증 없음
- ❌ AI 채팅 불가

**전략**: 가치 체험 → Lite 전환 유도

---

### 2. Lite (전환 퍼널)
```yaml
가격: ₩4,900/월
API 비용: ₩273/월
마진율: 19%
목적: Basic 전환 유도
```

**제공 기능**:
- ✅ 2개 AI 분석 (Gemini + Claude)
- ✅ Top 3 추천
- ✅ AI 채팅 3회/일
- ✅ 7일 이력 조회
- ❌ 교차검증 없음 (비교만)

**전략**: "2개면 좋은데, 3개 교차검증이 진짜지..." → Basic 전환

---

### 3. Basic (캐시카우 🎯)
```yaml
가격: ₩14,900/월
API 비용: ₩7,770/월
마진율: 24% ← 가장 높음!
목적: 핵심 수익원
```

**제공 기능**:
- ✅ **3개 AI 교차검증** (핵심!)
- ✅ **합의 등급** (STRONG/MODERATE/CONFLICT)
- ✅ Top 5 전체 보기
- ✅ AI 채팅 10회/일 (제한적)
- ✅ 종목 토론 요청 3개/일
- ✅ 30일 이력 + 백테스트
- ✅ 실시간 알림

**마케팅 포인트**:
> "AI 하나가 아니라 **세 개가 교차검증**합니다"
> "3개 AI가 모두 동의하면 🟢 STRONG 신뢰도"

**수익성**:
- 리더 쉐어 40%: ₩5,960
- PG 수수료 3%: ₩447
- API 비용: ₩7,770
- 순마진: **₩723** (24%)

---

### 4. Pro (프리미엄)
```yaml
가격: ₩39,900/월
API 비용: ₩34,250/월
마진율: 8.5% ← 주의!
목적: 헤비 유저
```

**제공 기능**:
- ✅ Basic의 모든 기능
- ✅ AI 채팅 50회/일 ⚠️ (캡 적용!)
- ✅ 상세 시나리오 분석
- ✅ 목표가 + 달성 시점
- ✅ 종목 토론 요청 20개/일
- ✅ VIP 전용 종목 추천
- ✅ 커스텀 심층 분석
- ✅ 90일 백테스트

**⚠️ 수익성 경고**:
```
무제한 채팅 시 API 비용 폭발 위험!
- 일일 50회 캡 필수
- 일일 API 비용 ₩1,713 초과 시 자동 차단
- 실시간 모니터링 트리거 작동
```

---

## 🔒 API 사용량 제한 로직

### 등급별 일일 한도

| 기능 | Free | Lite | Basic | Pro |
|------|------|------|-------|-----|
| **교차검증 분석** | 0 | 0 | 10 | 20 |
| **AI 채팅** | 0 | 3 | 10 | 50 ⚠️ |
| **종목 토론** | 0 | 0 | 3 | 20 |
| **심층 분석** | - | - | - | 5 |

### Pro 비용 폭발 방지
```typescript
// lib/subscription/usage-limiter.ts

// 1. 일일 API 비용 추적
getTodayApiCost(userId) -> { total: ₩1,500 }

// 2. 한도 초과 시 차단
if (cost.total >= ₩1,713) {
  return { allowed: false, message: "일일 사용량 초과" }
}

// 3. DB 트리거로 실시간 모니터링
CREATE TRIGGER trigger_check_pro_cost
```

---

## 📈 수익성 시뮬레이션

### 기본 시나리오
```
리더 증가: 월 10명
리더당 구독자: 30명
전환율: 15%
```

### 12개월 후 (안정기)
```
총 구독자: 2,160명
- Free:  1,296명 (60%)
- Lite:    324명 (15%)
- Basic:   432명 (20%) 🎯
- Pro:     108명 (5%)

월 매출: ₩11,134,800
월 API 비용: ₩6,876,000
월 순이익: ₩4,258,800
```

### BEP (손익분기점)
```
14개월차: 누적 수익 흑자 전환
24개월 누적: +₩80,000,000
```

---

## 🎨 UI/UX 설계

### 구독 페이지 레이아웃
```
┌─────────────────────────────────────────┐
│  💰 요금제 선택                          │
├─────────────────────────────────────────┤
│                                         │
│  [Free]  [Lite]  [Basic]★  [Pro]       │
│   ₩0    ₩4,900  ₩14,900  ₩39,900      │
│                                         │
│  [Free]                                 │
│  • 1개 AI 분석                          │
│  • Top 1만 보임                         │
│  • 교차검증 ❌                           │
│                                         │
│  [Lite]                                 │
│  • 2개 AI 비교                          │
│  • Top 3까지                            │
│  • 교차검증 ❌                           │
│                                         │
│  [Basic] ⭐ 인기                        │
│  • 🎯 3개 AI 교차검증                   │
│  • 🟢 합의 등급 표시                    │
│  • Top 5 전체                           │
│  • 실시간 알림                          │
│                                         │
│  [Pro]                                  │
│  • Basic + 무제한 분석                  │
│  • VIP 종목                             │
│  • 상세 시나리오                        │
└─────────────────────────────────────────┘
```

### 합의 등급 배지
```tsx
// components/ConsensusBadge.tsx

🟢 STRONG    - 3/3 AI 동의
🟡 MODERATE  - 2/3 AI 동의
🔴 CONFLICT  - 의견 분열
```

---

## 🔧 기술 스택

### 백엔드
```typescript
// 타입 정의
types/subscription.ts

// 플랜 설정
lib/subscription/config.ts

// 사용량 제한
lib/subscription/usage-limiter.ts

// DB 스키마
lib/subscription/schema.sql
```

### 프론트엔드
```tsx
// 구독 페이지
app/subscription/page.tsx

// 업그레이드 모달
components/UpgradeModal.tsx

// 기능 게이트
components/FeatureGate.tsx
```

### 데이터베이스
```sql
-- 구독 정보
subscriptions (
  tier VARCHAR CHECK (tier IN ('free', 'lite', 'basic', 'pro')),
  is_grandfathered BOOLEAN,
  legacy_price INTEGER
)

-- 사용량 추적
feature_usage (
  feature_key VARCHAR,
  usage_count INTEGER,
  api_cost INTEGER
)
```

---

## 📊 분석 지표

### 핵심 KPI
```
1. ARPU (Average Revenue Per User)
   = 총 매출 / 총 유저

2. LTV (Lifetime Value)
   = ARPU × 평균 구독 기간

3. CAC (Customer Acquisition Cost)
   = 마케팅 비용 / 신규 유저

4. Churn Rate (이탈률)
   = 이탈 유저 / 총 유저

5. 등급별 전환율
   Free → Lite → Basic → Pro
```

### 수익성 지표
```
1. 등급별 마진율
   Basic: 24% (목표)
   Pro: 8.5% (주의)

2. API 비용 효율
   API 비용 / 매출 < 50%

3. 유저당 API 비용
   Basic: ₩7,770/월 (예산 내)
   Pro: ₩34,250/월 (캡 필수)
```

---

## 🚨 리스크 관리

### 1. Pro 비용 폭발
**문제**: 무제한 채팅 시 API 비용 > 구독료
**해결**:
- [x] 일일 50회 캡
- [x] 일일 ₩1,713 비용 한도
- [x] 실시간 트리거 모니터링

### 2. Basic 이탈
**문제**: Pro 가격 부담 → Basic 유지
**해결**:
- Basic을 충분히 매력적으로
- Pro만의 독점 기능 (VIP 종목, 상세 시나리오)

### 3. Lite 정체
**문제**: Lite에서 Basic 전환 안 됨
**해결**:
- "2개는 비교, 3개가 진짜 검증" 메시지
- Lite에서 교차검증 미리보기 (흐림 처리)

---

## 📞 다음 단계

### Phase 1: 마이그레이션 ✅
- [x] 코드 변경
- [x] DB 스키마 업데이트
- [x] 사용량 제한 로직

### Phase 2: 배포 (TODO)
- [ ] Supabase SQL 실행
- [ ] 프론트엔드 확인
- [ ] 결제 테스트

### Phase 3: 모니터링 (TODO)
- [ ] API 비용 대시보드
- [ ] 등급별 전환율 추적
- [ ] 수익성 분석 리포트

---

**수익성 중심 구독 시스템 설계 완료!** 🎯
