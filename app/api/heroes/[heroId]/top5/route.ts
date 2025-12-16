import { NextRequest, NextResponse } from 'next/server';

// 캐릭터별 추천 기준 및 종목 풀
const HERO_CRITERIA = {
  claude: {
    name: 'Claude Lee',
    nameKo: '클로드 리',
    title: '숫자의 검사',
    criteria: '펀더멘털 기반 저평가 우량주',
    methodology: 'PER, PBR, ROE, 현금흐름 분석',
    // 클로드의 기준: 저평가 + 재무건전성 + 실적 성장
    stocks: [
      {
        rank: 1,
        symbol: '005930',
        name: '삼성전자',
        currentPrice: 71500,
        targetPrice: 95000,
        score: 4.5,
        reason: 'PBR 1.1배로 역사적 저점 수준. 메모리 업황 회복과 함께 실적 턴어라운드 기대. 현금 40조원 이상 보유로 재무건전성 최상.',
        metrics: {
          per: 15.2,
          pbr: 1.1,
          roe: 8.5,
          debtRatio: 25,
        },
        risks: ['중국 리스크', '스마트폰 시장 둔화'],
      },
      {
        rank: 2,
        symbol: '000660',
        name: 'SK하이닉스',
        currentPrice: 178000,
        targetPrice: 220000,
        score: 4.3,
        reason: 'HBM 시장 선도적 지위. AI 수요 폭발로 고대역폭 메모리 수혜 극대화. 영업이익률 개선 뚜렷.',
        metrics: {
          per: 8.5,
          pbr: 1.8,
          roe: 22.1,
          debtRatio: 35,
        },
        risks: ['메모리 가격 변동성', '설비투자 부담'],
      },
      {
        rank: 3,
        symbol: '035420',
        name: 'NAVER',
        currentPrice: 185000,
        targetPrice: 240000,
        score: 4.1,
        reason: '검색 광고 독점적 지위 유지. 커머스, 핀테크 신사업 성장세. PER 20배 미만으로 성장주 대비 저평가.',
        metrics: {
          per: 18.5,
          pbr: 1.4,
          roe: 12.3,
          debtRatio: 15,
        },
        risks: ['규제 리스크', '글로벌 경쟁 심화'],
      },
      {
        rank: 4,
        symbol: '105560',
        name: 'KB금융',
        currentPrice: 78500,
        targetPrice: 95000,
        score: 4.0,
        reason: 'PBR 0.5배 수준으로 심각한 저평가. 배당수익률 5% 이상. ROE 개선 추세 지속.',
        metrics: {
          per: 6.2,
          pbr: 0.52,
          roe: 9.8,
          debtRatio: 0,
        },
        risks: ['금리 인하 영향', '가계부채 리스크'],
      },
      {
        rank: 5,
        symbol: '017670',
        name: 'SK텔레콤',
        currentPrice: 53200,
        targetPrice: 65000,
        score: 3.9,
        reason: '통신 사업 안정적 현금 창출. AI 인프라, 데이터센터 신사업 확대. 배당수익률 4% 이상.',
        metrics: {
          per: 10.5,
          pbr: 0.85,
          roe: 8.2,
          debtRatio: 45,
        },
        risks: ['통신비 인하 압박', '5G 투자비용'],
      },
    ],
  },
  
  gemini: {
    name: 'Gemi Nine',
    nameKo: '제미 나인',
    title: '파괴적 혁신가',
    criteria: '미래 성장 잠재력 극대화',
    methodology: '기술 트렌드, TAM 분석, 혁신 역량 평가',
    // 제미의 기준: 성장성 + 혁신 + 미래 트렌드
    stocks: [
      {
        rank: 1,
        symbol: '000660',
        name: 'SK하이닉스',
        currentPrice: 178000,
        targetPrice: 280000,
        score: 5.0,
        reason: 'HBM 세계 1위! AI 시대의 핵심 수혜주. 엔비디아, AMD 모두 SK하이닉스 HBM 사용. This is THE AI play in Korea.',
        metrics: {
          growthRate: 45,
          tam: '500조원+',
          moat: '기술 격차 2년 이상',
        },
        risks: ['높은 변동성', '경쟁사 추격'],
      },
      {
        rank: 2,
        symbol: '035720',
        name: '카카오',
        currentPrice: 42500,
        targetPrice: 75000,
        score: 4.7,
        reason: '한국판 슈퍼앱. AI 적용 확대 중. 바닥에서 반등 시작. 지금 안 사면 후회할 구간.',
        metrics: {
          growthRate: 25,
          tam: '100조원+',
          moat: '플랫폼 독점력',
        },
        risks: ['규제 불확실성', '경영 리스크'],
      },
      {
        rank: 3,
        symbol: '373220',
        name: 'LG에너지솔루션',
        currentPrice: 365000,
        targetPrice: 550000,
        score: 4.5,
        reason: '글로벌 배터리 톱티어. 테슬라, GM, 현대차 모두 고객사. 전기차 전환은 거스를 수 없는 Secular trend.',
        metrics: {
          growthRate: 35,
          tam: '1000조원+',
          moat: '기술력 + 고객 다변화',
        },
        risks: ['원자재 가격', '중국 경쟁'],
      },
      {
        rank: 4,
        symbol: '247540',
        name: '에코프로비엠',
        currentPrice: 125000,
        targetPrice: 200000,
        score: 4.3,
        reason: '2차전지 양극재 1위. 하이니켈 기술 선도. 실적 턴어라운드 임박. High risk, high return.',
        metrics: {
          growthRate: 40,
          tam: '200조원+',
          moat: '기술 + 고객사 확보',
        },
        risks: ['주가 변동성 극심', '경쟁 심화'],
      },
      {
        rank: 5,
        symbol: '035420',
        name: 'NAVER',
        currentPrice: 185000,
        targetPrice: 280000,
        score: 4.1,
        reason: 'AI 검색 혁신 진행 중. 하이퍼클로바X 경쟁력. 글로벌 진출 가속화. 한국의 구글이 될 잠재력.',
        metrics: {
          growthRate: 20,
          tam: '300조원+',
          moat: '데이터 + AI 기술력',
        },
        risks: ['글로벌 빅테크 경쟁', '투자 비용 증가'],
      },
    ],
  },
  
  gpt: {
    name: 'G.P. Taylor',
    nameKo: 'G.P. 테일러',
    title: '월가의 노장',
    criteria: '리스크 최소화 방어주',
    methodology: '거시경제 분석, 배당 안정성, 위기 대응력 평가',
    // 테일러의 기준: 안정성 + 배당 + 위기 대응력
    stocks: [
      {
        rank: 1,
        symbol: '017670',
        name: 'SK텔레콤',
        currentPrice: 53200,
        targetPrice: 60000,
        score: 4.2,
        reason: '통신업 특성상 경기 방어적. 배당수익률 4%+로 안정적 현금흐름. 40년간 봐온 결과, 위기 때 이런 주식이 버팁니다.',
        metrics: {
          dividendYield: 4.2,
          beta: 0.65,
          volatility: '낮음',
        },
        risks: ['성장성 제한', '통신비 인하'],
      },
      {
        rank: 2,
        symbol: '105560',
        name: 'KB금융',
        currentPrice: 78500,
        targetPrice: 88000,
        score: 4.0,
        reason: '국내 최대 금융지주. 배당수익률 5%+. 금리 변동에도 안정적 수익 창출. 살아남는 자가 이기는 겁니다.',
        metrics: {
          dividendYield: 5.1,
          beta: 0.85,
          volatility: '중간',
        },
        risks: ['금리 민감도', '가계부채'],
      },
      {
        rank: 3,
        symbol: '030200',
        name: 'KT',
        currentPrice: 37800,
        targetPrice: 43000,
        score: 3.9,
        reason: '통신 + AI 인프라. 배당수익률 4%+. 저평가 영역. 조급하지 말고 천천히 모아가시길.',
        metrics: {
          dividendYield: 4.5,
          beta: 0.55,
          volatility: '낮음',
        },
        risks: ['성장 정체', '경쟁 심화'],
      },
      {
        rank: 4,
        symbol: '032830',
        name: '삼성생명',
        currentPrice: 75000,
        targetPrice: 85000,
        score: 3.8,
        reason: '보험업 선두주자. 금리 상승 수혜. 안정적 자산 운용. 위기 때 보험주가 버팁니다.',
        metrics: {
          dividendYield: 3.8,
          beta: 0.75,
          volatility: '낮음',
        },
        risks: ['저금리 전환 시 역풍', '보험 수요 감소'],
      },
      {
        rank: 5,
        symbol: '005930',
        name: '삼성전자',
        currentPrice: 71500,
        targetPrice: 82000,
        score: 3.7,
        reason: '대한민국 대표주. 현금 40조원 방어막. 다만 사이클 민감성으로 보수적 접근 필요.',
        metrics: {
          dividendYield: 2.5,
          beta: 1.1,
          volatility: '중간',
        },
        risks: ['메모리 사이클', '글로벌 경쟁'],
      },
    ],
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ heroId: string }> }
) {
  const { heroId } = await params;
  
  const heroData = HERO_CRITERIA[heroId as keyof typeof HERO_CRITERIA];
  
  if (!heroData) {
    return NextResponse.json(
      { error: 'Hero not found' },
      { status: 404 }
    );
  }
  
  // 추천 날짜 추가
  const today = new Date();
  const dateStr = today.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  return NextResponse.json({
    hero: {
      id: heroId,
      name: heroData.name,
      nameKo: heroData.nameKo,
      title: heroData.title,
      criteria: heroData.criteria,
      methodology: heroData.methodology,
    },
    date: dateStr,
    stocks: heroData.stocks,
  });
}

