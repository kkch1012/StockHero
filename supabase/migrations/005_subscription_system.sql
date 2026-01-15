-- =====================================================
-- StockHero 구독 시스템 마이그레이션
-- 생성일: 2026-01-15
-- =====================================================

-- 1. subscription_plans 테이블 (구독 플랜 정의)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,  -- 'free', 'basic', 'pro', 'vip'
  display_name TEXT NOT NULL,  -- '무료', '베이직', '프로', 'VIP'
  price_monthly INTEGER NOT NULL DEFAULT 0,  -- 월 가격 (원)
  price_yearly INTEGER NOT NULL DEFAULT 0,   -- 연 가격 (원)
  features JSONB NOT NULL DEFAULT '{}',      -- 기능 제한 설정
  is_active BOOLEAN DEFAULT true,            -- 플랜 활성화 여부
  sort_order INTEGER DEFAULT 0,              -- 정렬 순서
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. user_subscriptions 테이블 (사용자 구독 정보)
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial', 'past_due')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,  -- 기간 종료 시 취소 예정
  cancelled_at TIMESTAMPTZ,                    -- 취소 요청 시각
  trial_end TIMESTAMPTZ,                       -- 트라이얼 종료 시각
  payment_provider TEXT CHECK (payment_provider IN ('toss', 'kakao', 'portone', null)),
  payment_id TEXT,                             -- 결제 고유 ID
  billing_key TEXT,                            -- 자동결제용 빌링키
  metadata JSONB DEFAULT '{}',                 -- 추가 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 한 사용자당 하나의 활성 구독만 허용
  CONSTRAINT unique_active_subscription UNIQUE (user_id)
);

-- 3. subscription_usage 테이블 (일일 사용량 추적)
CREATE TABLE IF NOT EXISTS subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  ai_consultations_used INTEGER NOT NULL DEFAULT 0,  -- AI 상담 사용 횟수
  debates_watched INTEGER NOT NULL DEFAULT 0,        -- 토론 시청 횟수
  reports_downloaded INTEGER NOT NULL DEFAULT 0,     -- 리포트 다운로드 횟수
  portfolio_analyses INTEGER NOT NULL DEFAULT 0,     -- 포트폴리오 분석 횟수
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 사용자별 날짜별 유니크
  CONSTRAINT unique_user_date_usage UNIQUE (user_id, date)
);

-- 4. subscription_transactions 테이블 (결제 이력)
CREATE TABLE IF NOT EXISTS subscription_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id),
  plan_id UUID REFERENCES subscription_plans(id),
  amount INTEGER NOT NULL,                     -- 결제 금액
  currency TEXT DEFAULT 'KRW',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  payment_provider TEXT,
  payment_id TEXT,                             -- 결제사 거래 ID
  payment_method TEXT,                         -- 결제 수단 (card, kakao, etc.)
  receipt_url TEXT,                            -- 영수증 URL
  error_message TEXT,                          -- 실패 시 에러 메시지
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 인덱스 생성
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_period_end ON user_subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_user_date ON subscription_usage(user_id, date);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_user_id ON subscription_transactions(user_id);

-- =====================================================
-- RLS (Row Level Security) 정책
-- =====================================================

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_transactions ENABLE ROW LEVEL SECURITY;

-- subscription_plans: 모든 사용자가 읽기 가능
CREATE POLICY "subscription_plans_read_all" ON subscription_plans
  FOR SELECT USING (true);

-- user_subscriptions: 본인 것만 읽기/수정 가능
CREATE POLICY "user_subscriptions_read_own" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_subscriptions_insert_own" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_subscriptions_update_own" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- subscription_usage: 본인 것만 읽기/수정 가능
CREATE POLICY "subscription_usage_read_own" ON subscription_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "subscription_usage_insert_own" ON subscription_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subscription_usage_update_own" ON subscription_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- subscription_transactions: 본인 것만 읽기 가능
CREATE POLICY "subscription_transactions_read_own" ON subscription_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- 서비스 역할용 정책 (서버 사이드에서 사용)
-- =====================================================

-- Service role은 모든 테이블에 접근 가능 (supabase service_role_key 사용 시)

-- =====================================================
-- 기본 플랜 데이터 삽입
-- =====================================================

INSERT INTO subscription_plans (name, display_name, price_monthly, price_yearly, features, sort_order) VALUES
(
  'free',
  '무료',
  0,
  0,
  '{
    "ai_consultations_daily": 3,
    "debates_daily": 1,
    "reports_daily": 0,
    "portfolio_analyses_daily": 1,
    "calendar_access": true,
    "backtest_access": false,
    "realtime_alerts": false,
    "priority_support": false,
    "ad_free": false,
    "description": "기본 기능 무료 이용"
  }'::jsonb,
  0
),
(
  'basic',
  '베이직',
  9900,
  94800,
  '{
    "ai_consultations_daily": 10,
    "debates_daily": 5,
    "reports_daily": 3,
    "portfolio_analyses_daily": 3,
    "calendar_access": true,
    "backtest_access": true,
    "realtime_alerts": false,
    "priority_support": false,
    "ad_free": true,
    "description": "광고 없이 더 많은 AI 상담"
  }'::jsonb,
  1
),
(
  'pro',
  '프로',
  29900,
  298800,
  '{
    "ai_consultations_daily": 50,
    "debates_daily": 20,
    "reports_daily": 10,
    "portfolio_analyses_daily": 10,
    "calendar_access": true,
    "backtest_access": true,
    "realtime_alerts": true,
    "priority_support": false,
    "ad_free": true,
    "description": "실시간 알림 + 무제한에 가까운 사용"
  }'::jsonb,
  2
),
(
  'vip',
  'VIP',
  79900,
  718800,
  '{
    "ai_consultations_daily": -1,
    "debates_daily": -1,
    "reports_daily": -1,
    "portfolio_analyses_daily": -1,
    "calendar_access": true,
    "backtest_access": true,
    "realtime_alerts": true,
    "priority_support": true,
    "ad_free": true,
    "exclusive_picks": true,
    "description": "모든 기능 무제한 + 우선 지원 + VIP 전용 추천"
  }'::jsonb,
  3
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- =====================================================
-- 트리거: updated_at 자동 갱신
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_usage_updated_at
  BEFORE UPDATE ON subscription_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 헬퍼 함수: 사용자 현재 플랜 조회
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_plan(p_user_id UUID)
RETURNS TABLE (
  plan_name TEXT,
  plan_display_name TEXT,
  features JSONB,
  status TEXT,
  period_end TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.name,
    sp.display_name,
    sp.features,
    us.status,
    us.current_period_end
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = p_user_id
    AND us.status IN ('active', 'trial')
    AND us.current_period_end > NOW()
  LIMIT 1;
  
  -- 구독이 없으면 free 플랜 반환
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      sp.name,
      sp.display_name,
      sp.features,
      'active'::TEXT,
      NULL::TIMESTAMPTZ
    FROM subscription_plans sp
    WHERE sp.name = 'free'
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 헬퍼 함수: 일일 사용량 증가
-- =====================================================

CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_usage_type TEXT,
  p_amount INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
BEGIN
  -- UPSERT로 사용량 증가
  INSERT INTO subscription_usage (user_id, date)
  VALUES (p_user_id, v_today)
  ON CONFLICT (user_id, date) DO NOTHING;
  
  -- 사용량 타입에 따라 업데이트
  CASE p_usage_type
    WHEN 'ai_consultations' THEN
      UPDATE subscription_usage 
      SET ai_consultations_used = ai_consultations_used + p_amount
      WHERE user_id = p_user_id AND date = v_today;
    WHEN 'debates' THEN
      UPDATE subscription_usage 
      SET debates_watched = debates_watched + p_amount
      WHERE user_id = p_user_id AND date = v_today;
    WHEN 'reports' THEN
      UPDATE subscription_usage 
      SET reports_downloaded = reports_downloaded + p_amount
      WHERE user_id = p_user_id AND date = v_today;
    WHEN 'portfolio_analyses' THEN
      UPDATE subscription_usage 
      SET portfolio_analyses = portfolio_analyses + p_amount
      WHERE user_id = p_user_id AND date = v_today;
    ELSE
      RETURN FALSE;
  END CASE;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 헬퍼 함수: 사용량 한도 체크
-- =====================================================

CREATE OR REPLACE FUNCTION check_usage_limit(
  p_user_id UUID,
  p_usage_type TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_plan_features JSONB;
  v_limit INTEGER;
  v_used INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- 사용자 플랜 features 조회
  SELECT sp.features INTO v_plan_features
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = p_user_id
    AND us.status IN ('active', 'trial')
    AND us.current_period_end > NOW();
  
  -- 구독이 없으면 free 플랜
  IF v_plan_features IS NULL THEN
    SELECT features INTO v_plan_features
    FROM subscription_plans WHERE name = 'free';
  END IF;
  
  -- 한도 조회
  v_limit := (v_plan_features ->> (p_usage_type || '_daily'))::INTEGER;
  
  -- -1은 무제한
  IF v_limit = -1 THEN
    RETURN jsonb_build_object('allowed', true, 'limit', -1, 'used', 0, 'remaining', -1);
  END IF;
  
  -- 현재 사용량 조회
  SELECT 
    CASE p_usage_type
      WHEN 'ai_consultations' THEN ai_consultations_used
      WHEN 'debates' THEN debates_watched
      WHEN 'reports' THEN reports_downloaded
      WHEN 'portfolio_analyses' THEN portfolio_analyses
      ELSE 0
    END INTO v_used
  FROM subscription_usage
  WHERE user_id = p_user_id AND date = v_today;
  
  IF v_used IS NULL THEN
    v_used := 0;
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', v_used < v_limit,
    'limit', v_limit,
    'used', v_used,
    'remaining', GREATEST(0, v_limit - v_used)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 완료 메시지
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ 구독 시스템 마이그레이션 완료!';
  RAISE NOTICE '- subscription_plans: 4개 플랜 생성 (free, basic, pro, vip)';
  RAISE NOTICE '- user_subscriptions: 사용자 구독 테이블';
  RAISE NOTICE '- subscription_usage: 일일 사용량 추적 테이블';
  RAISE NOTICE '- subscription_transactions: 결제 이력 테이블';
END $$;
