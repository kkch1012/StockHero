-- =====================================================
-- StockHero 완전 통합 스키마 + 마이그레이션
-- 처음부터 끝까지 한 번에 실행
-- =====================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- 텍스트 검색용

-- =====================================================
-- PART 1: 기본 테이블 생성
-- =====================================================

-- 1. Subscriptions 테이블
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,

  -- 구독 정보 (신규 tier 구조)
  tier VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'lite', 'basic', 'pro')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),

  -- Grandfathering (기존 유저 가격 보호)
  is_grandfathered BOOLEAN DEFAULT false,
  legacy_price INTEGER,

  -- 결제 주기
  billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),

  -- 기간
  started_at TIMESTAMPTZ DEFAULT NOW(),
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  -- 결제 정보 (토스페이먼츠)
  payment_customer_id VARCHAR(255),
  payment_billing_key VARCHAR(255),
  payment_subscription_id VARCHAR(255),

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Payments 테이블
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- 결제 정보
  amount INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'KRW',
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),

  -- 결제 제공자 정보
  payment_id VARCHAR(255),
  payment_method VARCHAR(50),

  -- 상품 정보
  plan_id VARCHAR(20) NOT NULL,
  billing_cycle VARCHAR(20),

  -- 영수증
  receipt_url TEXT,

  -- 실패 시 정보
  failure_reason TEXT,

  -- 메타데이터
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Feature Usage 테이블 (사용량 추적)
CREATE TABLE IF NOT EXISTS feature_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,

  -- 기능 정보
  feature_key VARCHAR(50) NOT NULL,
  usage_count INTEGER DEFAULT 0,
  usage_date DATE DEFAULT CURRENT_DATE,

  -- API 비용 추적 (신규)
  api_cost INTEGER DEFAULT 0,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, feature_key, usage_date)
);

-- 4. Analysis History 테이블 (교차검증 결과 저장)
CREATE TABLE IF NOT EXISTS analysis_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,

  -- 분석 대상
  symbol VARCHAR(20) NOT NULL,
  symbol_name VARCHAR(100) NOT NULL,
  sector VARCHAR(50),

  -- 구독 정보
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('free', 'lite', 'basic', 'pro')),
  analysis_type VARCHAR(50) NOT NULL, -- 'single', 'comparison', 'cross_validation', 'debate'

  -- 교차검증 결과
  consensus_grade VARCHAR(20), -- 'STRONG', 'MODERATE', 'CONFLICT'
  consensus_confidence INTEGER, -- 0-100
  consensus_price INTEGER,

  -- 사용한 AI
  used_ais TEXT[], -- ['gemini', 'claude', 'gpt']

  -- API 비용
  api_cost INTEGER DEFAULT 0,

  -- 전체 결과 (JSON)
  result JSONB,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Migrations 테이블 (마이그레이션 추적)
CREATE TABLE IF NOT EXISTS migrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PART 2: 인덱스 생성
-- =====================================================

-- Subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_grandfathered ON subscriptions(is_grandfathered)
WHERE is_grandfathered = true;

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Feature Usage
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_date ON feature_usage(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_feature_usage_cost ON feature_usage(user_id, usage_date, api_cost);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature_key ON feature_usage(feature_key, usage_date);

-- Analysis History
CREATE INDEX IF NOT EXISTS idx_analysis_history_user ON analysis_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_history_symbol ON analysis_history(symbol, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_history_tier ON analysis_history(tier, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_history_grade ON analysis_history(consensus_grade, created_at DESC);

-- =====================================================
-- PART 3: RLS (Row Level Security) 정책
-- =====================================================

-- Subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access subscriptions" ON subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access payments" ON payments
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Feature Usage
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON feature_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access usage" ON feature_usage
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Analysis History
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analysis history" ON analysis_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access analysis history" ON analysis_history
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- PART 4: 트리거 함수
-- =====================================================

-- updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Subscriptions updated_at 트리거
DROP TRIGGER IF EXISTS subscriptions_updated_at ON subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Feature Usage updated_at 트리거
DROP TRIGGER IF EXISTS feature_usage_updated_at ON feature_usage;
CREATE TRIGGER feature_usage_updated_at
  BEFORE UPDATE ON feature_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Analysis History updated_at 트리거
DROP TRIGGER IF EXISTS analysis_history_updated_at ON analysis_history;
CREATE TRIGGER analysis_history_updated_at
  BEFORE UPDATE ON analysis_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Pro 사용자 API 비용 모니터링 트리거
CREATE OR REPLACE FUNCTION check_pro_user_cost_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_tier VARCHAR;
  v_today_cost INTEGER;
BEGIN
  -- 사용자 티어 조회
  SELECT tier INTO v_tier
  FROM subscriptions
  WHERE user_id = NEW.user_id
    AND status = 'active';

  -- Pro 등급만 체크
  IF v_tier = 'pro' THEN
    -- 오늘 총 비용 계산
    SELECT COALESCE(SUM(api_cost), 0) INTO v_today_cost
    FROM feature_usage
    WHERE user_id = NEW.user_id
      AND usage_date = CURRENT_DATE;

    -- 일일 한도: ₩1,713
    IF v_today_cost > 1713 THEN
      RAISE NOTICE 'Pro user % exceeded daily API cost limit: ₩%', NEW.user_id, v_today_cost;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_pro_cost ON feature_usage;
CREATE TRIGGER trigger_check_pro_cost
  AFTER INSERT OR UPDATE ON feature_usage
  FOR EACH ROW EXECUTE FUNCTION check_pro_user_cost_limit();

-- =====================================================
-- PART 5: 유틸리티 함수
-- =====================================================

-- 사용자 티어 조회
CREATE OR REPLACE FUNCTION get_user_tier(p_user_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  v_tier VARCHAR;
BEGIN
  SELECT tier INTO v_tier
  FROM subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
    AND (current_period_end IS NULL OR current_period_end > NOW());

  RETURN COALESCE(v_tier, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기능 사용량 증가
CREATE OR REPLACE FUNCTION increment_feature_usage(p_user_id UUID, p_feature_key VARCHAR)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO feature_usage (user_id, feature_key, usage_count, usage_date)
  VALUES (p_user_id, p_feature_key, 1, CURRENT_DATE)
  ON CONFLICT (user_id, feature_key, usage_date)
  DO UPDATE SET usage_count = feature_usage.usage_count + 1, updated_at = NOW()
  RETURNING usage_count INTO v_count;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 오늘 기능 사용량 조회
CREATE OR REPLACE FUNCTION get_today_usage(p_user_id UUID, p_feature_key VARCHAR)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT usage_count INTO v_count
  FROM feature_usage
  WHERE user_id = p_user_id
    AND feature_key = p_feature_key
    AND usage_date = CURRENT_DATE;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 등급별 AI 개수 반환
CREATE OR REPLACE FUNCTION get_ai_count(p_tier VARCHAR)
RETURNS INTEGER AS $$
BEGIN
  CASE p_tier
    WHEN 'free' THEN RETURN 1;
    WHEN 'lite' THEN RETURN 2;
    WHEN 'basic' THEN RETURN 3;
    WHEN 'pro' THEN RETURN 3;
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 교차검증 가능 여부
CREATE OR REPLACE FUNCTION has_cross_validation(p_tier VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_tier IN ('basic', 'pro');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 등급별 예상 API 비용
CREATE OR REPLACE FUNCTION get_expected_api_cost(p_tier VARCHAR)
RETURNS INTEGER AS $$
BEGIN
  CASE p_tier
    WHEN 'free' THEN RETURN 5;
    WHEN 'lite' THEN RETURN 20;
    WHEN 'basic' THEN RETURN 30;
    WHEN 'pro' THEN RETURN 30;
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- PART 6: 뷰 (Views)
-- =====================================================

-- 구독 통계
CREATE OR REPLACE VIEW subscription_stats AS
SELECT
  tier,
  COUNT(*) as user_count,
  COUNT(*) FILTER (WHERE is_grandfathered) as grandfathered_count,
  AVG(CASE
    WHEN is_grandfathered THEN legacy_price
    ELSE CASE tier
      WHEN 'lite' THEN 4900
      WHEN 'basic' THEN 14900
      WHEN 'pro' THEN 39900
      ELSE 0
    END
  END) as avg_revenue,
  MIN(created_at) as oldest_subscription,
  MAX(created_at) as newest_subscription
FROM subscriptions
WHERE status = 'active'
GROUP BY tier
ORDER BY
  CASE tier
    WHEN 'free' THEN 1
    WHEN 'lite' THEN 2
    WHEN 'basic' THEN 3
    WHEN 'pro' THEN 4
  END;

-- 분석 통계
CREATE OR REPLACE VIEW analysis_stats AS
SELECT
  DATE(created_at) as date,
  tier,
  analysis_type,
  consensus_grade,
  COUNT(*) as analysis_count,
  SUM(api_cost) as total_api_cost,
  AVG(api_cost) as avg_api_cost,
  AVG(consensus_confidence) as avg_confidence
FROM analysis_history
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), tier, analysis_type, consensus_grade
ORDER BY date DESC, tier;

-- =====================================================
-- PART 7: 사용량 리포트 함수
-- =====================================================

CREATE OR REPLACE FUNCTION generate_usage_report(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  tier VARCHAR,
  users BIGINT,
  total_analyses BIGINT,
  total_api_cost BIGINT,
  avg_api_cost_per_user NUMERIC,
  revenue_estimate NUMERIC,
  margin_estimate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.tier,
    COUNT(DISTINCT s.user_id) as users,
    COUNT(ah.id) as total_analyses,
    COALESCE(SUM(ah.api_cost), 0)::BIGINT as total_api_cost,
    ROUND(COALESCE(SUM(ah.api_cost), 0)::NUMERIC / NULLIF(COUNT(DISTINCT s.user_id), 0), 2) as avg_api_cost_per_user,
    CASE s.tier
      WHEN 'lite' THEN COUNT(DISTINCT s.user_id) * 4900
      WHEN 'basic' THEN COUNT(DISTINCT s.user_id) * 14900
      WHEN 'pro' THEN COUNT(DISTINCT s.user_id) * 39900
      ELSE 0
    END::NUMERIC as revenue_estimate,
    CASE s.tier
      WHEN 'lite' THEN (COUNT(DISTINCT s.user_id) * 4900) - COALESCE(SUM(ah.api_cost), 0)
      WHEN 'basic' THEN (COUNT(DISTINCT s.user_id) * 14900) - COALESCE(SUM(ah.api_cost), 0)
      WHEN 'pro' THEN (COUNT(DISTINCT s.user_id) * 39900) - COALESCE(SUM(ah.api_cost), 0)
      ELSE -COALESCE(SUM(ah.api_cost), 0)
    END::NUMERIC as margin_estimate
  FROM subscriptions s
  LEFT JOIN analysis_history ah ON ah.user_id = s.user_id
    AND ah.created_at BETWEEN p_start_date AND p_end_date
  WHERE s.status = 'active'
  GROUP BY s.tier
  ORDER BY
    CASE s.tier
      WHEN 'free' THEN 1
      WHEN 'lite' THEN 2
      WHEN 'basic' THEN 3
      WHEN 'pro' THEN 4
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 8: 초기 데이터 (선택)
-- =====================================================

-- 마이그레이션 기록
INSERT INTO migrations (name, executed_at)
VALUES ('000_complete_schema', NOW())
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- PART 9: 확인 쿼리
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ StockHero 스키마 생성 완료!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '생성된 테이블:';
  RAISE NOTICE '  - subscriptions (구독)';
  RAISE NOTICE '  - payments (결제)';
  RAISE NOTICE '  - feature_usage (사용량)';
  RAISE NOTICE '  - analysis_history (분석 이력)';
  RAISE NOTICE '  - migrations (마이그레이션 기록)';
  RAISE NOTICE '';
  RAISE NOTICE '생성된 함수: 9개';
  RAISE NOTICE '생성된 뷰: 2개 (subscription_stats, analysis_stats)';
  RAISE NOTICE '생성된 트리거: 4개';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- 테이블 확인
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('subscriptions', 'payments', 'feature_usage', 'analysis_history', 'migrations')
ORDER BY table_name;

-- 함수 확인
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_user_tier',
    'get_ai_count',
    'has_cross_validation',
    'get_expected_api_cost',
    'increment_feature_usage',
    'get_today_usage',
    'generate_usage_report'
  )
ORDER BY routine_name;
