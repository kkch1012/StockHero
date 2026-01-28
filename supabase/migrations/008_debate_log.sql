-- 008_debate_log.sql
-- AI 토론 로그 저장을 위한 컬럼 추가

-- verdicts 테이블에 토론 로그 컬럼 추가
ALTER TABLE verdicts 
ADD COLUMN IF NOT EXISTS debate_log JSONB DEFAULT NULL;

-- 코멘트 추가
COMMENT ON COLUMN verdicts.debate_log IS 'AI 3대장 토론 전체 로그 (3라운드)';

-- 기존에 없을 수 있는 컬럼들도 추가
ALTER TABLE verdicts
ADD COLUMN IF NOT EXISTS claude_top5 JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS gemini_top5 JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS gpt_top5 JSONB DEFAULT NULL;

-- 코멘트
COMMENT ON COLUMN verdicts.claude_top5 IS '클로드 개별 Top 5';
COMMENT ON COLUMN verdicts.gemini_top5 IS '제미나인 개별 Top 5';
COMMENT ON COLUMN verdicts.gpt_top5 IS '테일러 개별 Top 5';

-- 인덱스 추가 (토론 로그 검색용)
CREATE INDEX IF NOT EXISTS idx_verdicts_debate_log 
ON verdicts USING GIN (debate_log);
