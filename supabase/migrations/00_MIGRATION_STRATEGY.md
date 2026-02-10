# 🚨 Supabase 마이그레이션 전략

## 현재 상황 분석

### 데이터베이스에 존재하는 스키마
- **OLD 스키마** (001~008 마이그레이션 파일로 생성):
  - `user_subscriptions` 테이블
  - `subscription_plans` 테이블
  - `subscription_usage` 테이블
  - `subscription_transactions` 테이블

### 애플리케이션 코드가 기대하는 스키마
- **NEW 스키마** (lib/subscription/service.ts 등에서 사용):
  - `subscriptions` 테이블 (티어 직접 저장, 단순화)
  - `payments` 테이블
  - `feature_usage` 테이블 (api_cost 포함)
  - `analysis_history` 테이블 (교차검증 결과 저장)

## ⚠️ 중요한 결정

다음 중 하나를 선택해야 합니다:

### 옵션 A: 데이터 마이그레이션 (기존 사용자 데이터 보존)
**실행 파일**: `999_migrate_old_to_new_schema.sql` (생성 예정)
- 기존 `user_subscriptions` 데이터를 `subscriptions`로 변환
- 기존 구독자 데이터 보존
- 약간 복잡하지만 안전함

### 옵션 B: 클린 스타트 (데이터 초기화)
**실행 파일**: `000_complete_schema.sql` (이미 존재)
- 기존 OLD 테이블 전부 삭제
- NEW 스키마 처음부터 생성
- 간단하지만 기존 구독자 데이터 손실

## 📊 어떤 옵션을 선택해야 하나?

### 옵션 A를 선택해야 하는 경우:
- ✅ 실제 서비스 중이고 구독자가 있음
- ✅ 결제 데이터를 보존해야 함
- ✅ 프로덕션 환경

### 옵션 B를 선택해야 하는 경우:
- ✅ 개발/테스트 환경
- ✅ 아직 실제 구독자가 없거나 테스트 데이터만 있음
- ✅ 빠르게 새 스키마로 시작하고 싶음

## 🎯 권장 사항

현재 프로젝트는 **개발 중**이므로 **옵션 B (클린 스타트)**를 권장합니다.

다음 파일만 실행하면 됩니다:
```
supabase/migrations/000_complete_schema.sql
```

## 다음 단계

원하는 옵션을 알려주시면:
- **옵션 A**: `999_migrate_old_to_new_schema.sql` 파일 생성해드림
- **옵션 B**: `000_complete_schema.sql` 실행 가이드 제공
