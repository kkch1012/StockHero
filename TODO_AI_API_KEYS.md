# 🔑 AI API 키 설정 (나중에 할 일)

## ⏳ 상태: 대기 중

Supabase 설정은 완료되었으나, 교차검증 시스템 작동을 위해 AI API 키 3개가 필요합니다.

---

## 📋 필요한 키 (3개)

### 1. Claude (Anthropic) - 필수
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**발급 방법:**
1. https://console.anthropic.com/ 접속
2. 로그인 (GitHub/Google 계정 가능)
3. Settings → API Keys → **Create Key**
4. 키 복사

**비용:**
- 첫 $5 무료 크레딧
- 그 이후 사용량 과금

---

### 2. Gemini (Google AI) - 필수
```bash
GOOGLE_AI_API_KEY=AIzaSy...
```

**발급 방법:**
1. https://aistudio.google.com/app/apikey 접속
2. Google 계정 로그인
3. **Create API Key** 클릭
4. 키 복사

**비용:**
- 완전 무료
- 월 15 RPM (분당 요청 수) 제한

---

### 3. OpenAI (GPT) - 필수
```bash
OPENAI_API_KEY=sk-proj-...
```

**발급 방법:**
1. https://platform.openai.com/api-keys 접속
2. 로그인
3. **Create new secret key** 클릭
4. 키 복사

**비용:**
- $5 크레딧 필요 (카드 등록)
- 사용량 과금

---

## 🎯 키 발급 후 할 일

### 1. .env.local 파일 업데이트
키를 발급받으면 `/Users/bottle/StockHero/.env.local` 파일을 열어서:

```bash
# AI/LLM API Keys (교차검증에 3개 모두 필요!)
ANTHROPIC_API_KEY=여기에-클로드-키-붙여넣기
GOOGLE_AI_API_KEY=여기에-제미나이-키-붙여넣기
OPENAI_API_KEY=여기에-GPT-키-붙여넣기
```

### 2. 개발 서버 재시작
```bash
# 기존 서버 중지 (Ctrl+C)
npm run dev
```

### 3. API 테스트
```bash
curl -X POST http://localhost:3001/api/analysis/cross-validate \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "005930",
    "symbolName": "삼성전자",
    "currentPrice": 75000
  }'
```

---

## ⚡ 빠른 발급 가이드 (5분)

1. **Gemini 먼저** (제일 쉬움, 무료)
   - Google 계정만 있으면 1분 완료

2. **Claude**
   - GitHub 계정으로 로그인 가능
   - 2분 완료

3. **OpenAI**
   - 카드 등록 필요해서 제일 오래 걸림
   - 3-5분 완료

---

## 💰 예상 비용

개발/테스트 단계에서는 거의 무료입니다:

- **Gemini**: 완전 무료
- **Claude**: 첫 $5 무료 (약 200-500회 분석 가능)
- **OpenAI**: $5 충전 필요 (약 100-200회 분석 가능)

**하루 10번 테스트한다고 가정:**
- 비용: $0.3-0.5 / 일
- Claude 무료 크레딧으로 약 2주 사용 가능

---

## 📝 체크리스트

- [ ] Gemini API 키 발급
- [ ] Claude API 키 발급
- [ ] OpenAI API 키 발급
- [ ] .env.local 파일 업데이트
- [ ] 개발 서버 재시작
- [ ] API 테스트 실행
- [ ] 교차검증 정상 작동 확인

---

## 🚨 주의사항

1. **키 보안**
   - .env.local 파일은 절대 Git에 커밋하지 마세요
   - 이미 .gitignore에 포함되어 있음

2. **키 유효기간**
   - API 키는 만료되지 않음
   - 필요시 재발급 가능

3. **비용 관리**
   - Pro 티어는 일일 ₩1,713 한도 설정됨
   - 초과 시 자동 경고 (트리거)

---

## 🔗 관련 문서

- 교차검증 구현: `docs/CROSS_VALIDATION_IMPLEMENTATION.md`
- 티어 차이: `docs/TIER_DIFFERENCES.md`
- 전체 변경사항: `docs/CHANGELOG_2026-02-09.md`

---

**작성일**: 2026-02-09
**우선순위**: 중간 (프론트엔드 작업과 병행 가능)
**소요 시간**: 5-10분
