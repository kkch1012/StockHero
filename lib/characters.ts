import type { CharacterType } from './types';

export interface CharacterInfo {
  id: CharacterType;
  name: string;
  nameKo: string;
  role: string;
  roleKo: string;
  image: string;
  color: string;
  gradient: string;
  bgColor: string;
  description: string;
  tags: string[];
  // Extended details
  fullBio: string;
  analysisStyle: string;
  strengths: string[];
  focusAreas: string[];
  catchphrase: string;
  experience: string;
  accuracy: number;
  totalAnalyses: number;
}

export const CHARACTERS: Record<CharacterType, CharacterInfo> = {
  claude: {
    id: 'claude',
    name: 'Claude Lee',
    nameKo: '클로드 리',
    role: 'Balanced Analyst',
    roleKo: '균형 분석가',
    image: '/images/characters/claude.png',
    color: 'text-amber-400',
    gradient: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-500/10',
    description: '침착하고 분석적이며 디테일에 강함. 실적, 재무구조, 산업 구조를 깊이 파고드는 타입.',
    tags: ['Financials', 'Valuation'],
    // Extended details
    fullBio: '월스트리트에서 10년간 활동한 후 AI 애널리스트로 전환한 클로드 리는 재무제표를 읽는 것을 마치 소설 읽듯 즐깁니다. "숫자는 거짓말을 하지 않아요"가 그의 좌우명입니다. 매번 분석할 때마다 최소 50개 이상의 재무 지표를 확인하며, 특히 현금흐름과 부채비율에 집중합니다.',
    analysisStyle: '데이터 중심의 정량적 분석을 선호합니다. 감정을 배제하고 오직 숫자로만 판단하며, 3개월~1년의 중기적 관점에서 기업을 평가합니다.',
    strengths: [
      '재무제표 심층 분석',
      'DCF 밸류에이션',
      '산업 구조 분석',
      '경쟁사 비교 분석',
      '실적 예측 정확도',
    ],
    focusAreas: [
      '영업이익률 추이',
      '잉여현금흐름(FCF)',
      'ROE/ROA',
      '부채비율',
      'PER/PBR 밴드',
    ],
    catchphrase: '"숫자 뒤에 숨은 이야기를 읽어야 합니다"',
    experience: '금융 분석 경력 10년',
    accuracy: 67.3,
    totalAnalyses: 1247,
  },
  gemini: {
    id: 'gemini',
    name: 'Gemi Nine',
    nameKo: '제미 나인',
    role: 'Future Trend Strategist',
    roleKo: '혁신 트렌드 전략가',
    image: '/images/characters/gemini.png',
    color: 'text-emerald-400',
    gradient: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-500/10',
    description: '세련됨, 센스, 빠른 판단. 신성장 산업, 기술주, 혁신 섹터 분석의 1인자.',
    tags: ['Tech Trends', 'Innovation'],
    // Extended details
    fullBio: '실리콘밸리 출신의 제미 나인은 테크 기업들의 미래를 예측하는 데 탁월한 능력을 보여왔습니다. 스타트업 생태계를 누구보다 잘 이해하며, 새로운 기술 트렌드를 가장 먼저 포착합니다. "오늘의 혁신이 내일의 표준이 됩니다"라는 신념을 가지고 있습니다.',
    analysisStyle: '트렌드 중심의 정성적 분석을 선호합니다. 기술 변화의 방향성과 시장 채택 속도를 예측하며, 1~3년의 중장기 성장 잠재력에 집중합니다.',
    strengths: [
      '신기술 트렌드 예측',
      '성장주 발굴',
      '글로벌 테크 동향 분석',
      'TAM/SAM 시장 규모 추정',
      '혁신 기업 조기 발견',
    ],
    focusAreas: [
      'AI/ML 기술 발전',
      '반도체 사이클',
      '플랫폼 비즈니스 모델',
      'SaaS 성장 지표',
      '신재생에너지/전기차',
    ],
    catchphrase: '"미래를 예측하는 가장 좋은 방법은 미래를 만드는 것입니다"',
    experience: '테크 섹터 전문 분석 8년',
    accuracy: 64.8,
    totalAnalyses: 982,
  },
  gpt: {
    id: 'gpt',
    name: 'G.P. Taylor',
    nameKo: '지피 테일러',
    role: 'Chief Macro & Risk Officer',
    roleKo: '수석 장기전략 리스크 총괄',
    image: '/images/characters/gpt.png',
    color: 'text-violet-400',
    gradient: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-500/10',
    description: '중후함, 느긋함, 깊은 통찰. 거시경제, 금리, 위험요인 분석의 원로 애널리스트.',
    tags: ['Macro', 'Risk'],
    // Extended details
    fullBio: '40년간 글로벌 금융 시장을 지켜봐온 지피 테일러는 수많은 금융위기와 호황기를 경험한 베테랑입니다. FED의 결정, 지정학적 리스크, 그리고 시장 심리를 읽는 데 탁월합니다. "역사는 반복되지 않지만, 운율은 맞춘다"는 마크 트웨인의 말을 좋아합니다.',
    analysisStyle: '거시경제적 관점에서 하향식(Top-down) 분석을 선호합니다. 리스크 관리를 최우선으로 하며, 장기적 안목으로 시장을 바라봅니다.',
    strengths: [
      '거시경제 분석',
      '금리/환율 영향 분석',
      '지정학적 리스크 평가',
      '시장 사이클 예측',
      '포트폴리오 리스크 관리',
    ],
    focusAreas: [
      'FED/중앙은행 정책',
      '인플레이션 추이',
      '글로벌 무역 동향',
      '원자재 가격',
      '시장 변동성(VIX)',
    ],
    catchphrase: '"시장은 당신이 지불 능력을 유지할 수 있는 것보다 더 오래 비이성적일 수 있습니다"',
    experience: '글로벌 매크로 분석 40년',
    accuracy: 71.2,
    totalAnalyses: 3891,
  },
};

export function getCharacter(type: CharacterType): CharacterInfo {
  return CHARACTERS[type];
}
