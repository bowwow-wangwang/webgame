// 보내두기 중 갈림길 시드 (가짜 서버용 일부).
// 원본은 docs/content/이벤트 스크립트.md (설정집 "이벤트 스크립트" 탭). 진짜는 choice_events / choice_options 시드로 들어간다.
// 판정 능력치와 극단적 성공·실패 문구는 같은 문서 9절 판정표를 따른다.
import type { PaperNote, Role, StatKey } from '../../types/domain';

export interface OptionSeed {
  id: 'A' | 'B' | 'C';
  label: string;
  auto?: boolean;
  stat?: StatKey;
  result: string;
  record?: string;
  paper?: PaperNote;
  /** 판정에 실패했을 때. 없으면 결과 끝에 "생각보다 오래 걸렸다."를 붙인다. */
  fail?: string;
  failRecord?: string | null;
  failPaper?: PaperNote | null;
  /** 극단적 성공이면 덧붙는 결과. */
  extreme?: string;
  /** 능력자의 오염 변화. 다른 역할이 고르면 오염 대신 덤 하나를 포기한다. */
  contamination?: number;
  item?: string;
}

export interface ForkSeed {
  code: string;
  title: string;
  roles: Role[] | 'all';
  gov?: boolean;
  situation: string;
  /** 상황에 들어갈 다른 캐릭터의 자리. 없으면 이름 없는 사람으로 바뀐다. */
  who?: { slot: '{동료}' | '{능력자}' | '{여행자}'; role: Role | null; npc: string };
  options: OptionSeed[];
}

const gov = (text: string): PaperNote => ({ from: 'gov', text });
const fdn = (text: string): PaperNote => ({ from: 'foundation', text });

export const FORKS: ForkSeed[] = [
  // ── 능력자 (출동) ──
  {
    code: 'N01',
    title: '무전 속 구조 요청',
    roles: ['ability'],
    gov: true,
    situation: '출동 중 무전 주파수에 낯선 구조 요청이 섞여 들어온다. 정부 지시는 "임무 외 행동 금지"다.',
    options: [
      {
        id: 'A',
        label: '신호를 따라간다',
        stat: 'craft',
        result: '고립된 정착지 주민 둘을 찾아 정착지까지 데려다주었다. 정화 기여는 조금 줄었다.',
        record: '명령보다 구조 요청을 따랐다',
        paper: gov('임무 이탈 경위서 제출 요망'),
        extreme: '주민이 정착지에서 고맙다는 편지를 보내 올 것이다.',
      },
      { id: 'B', label: '위치를 재단에 넘긴다', result: '재단 구호팀이 대신 갔다는 회신이 왔다.', record: '구조 요청을 재단에 넘겼다' },
      { id: 'C', label: '임무에 집중한다', auto: true, result: '예정대로 정화를 마쳤다.' },
    ],
  },
  {
    code: 'N02',
    title: '무너진 집의 사진',
    roles: ['ability'],
    situation: '무너진 집 안에 액자가 떨어져 있다. 모르는 사람들이 웃고 있다.',
    options: [
      { id: 'A', label: '챙긴다', result: '기념품 "주인 모를 사진"을 얻었다.', record: '낯선 집의 사진을 챙겼다', item: '주인 모를 사진' },
      { id: 'B', label: '제자리에 세워 둔다', auto: true, result: '액자를 세워 두고 나왔다.', record: '사진을 그 자리에 세워 두었다' },
    ],
  },
  {
    code: 'N03',
    title: '오염 경보',
    roles: ['ability'],
    situation: '계측기가 경고음을 낸다. 조금만 더 있으면 구역 하나를 끝낼 수 있다.',
    options: [
      {
        id: 'A',
        label: '조금 더 버틴다',
        stat: 'con',
        result: '정화 기여가 늘었다. 오염도 그만큼 더 쌓였다.',
        contamination: 6,
        fail: '오래 버티지 못하고 물러났다. 더 버틴 만큼의 기여는 남았다.',
        failRecord: '경보 속에서 버티려 했다',
        extreme: '오염은 더 쌓이지 않았다.',
      },
      { id: 'B', label: '철수한다', auto: true, result: '무리하지 않고 돌아왔다.' },
    ],
  },
  {
    code: 'N04',
    title: '따라붙는 드론',
    roles: ['ability'],
    gov: true,
    situation: '정부 감시 드론이 따라붙어 능력 사용을 기록하기 시작한다.',
    options: [
      { id: 'A', label: '신경 쓰지 않는다', auto: true, result: '평소처럼 일을 마쳤다.' },
      {
        id: 'B',
        label: '능력을 덜 쓴다',
        stat: 'craft',
        result: '오염은 덜 쌓였고 기여도 조금 줄었다.',
        record: '감시 아래서 능력을 아꼈다',
        contamination: -3,
        fail: '능력을 아끼다 보니 일이 더뎠다. 오염은 덜 쌓였다.',
        failRecord: '감시 아래서 능력을 아꼈다',
        extreme: '기여는 줄지 않았다.',
      },
      {
        id: 'C',
        label: '시야 밖으로 돈다',
        stat: 'dex',
        result: '드론을 따돌렸다.',
        record: '감시 드론을 따돌렸다',
        paper: gov('관측 공백 발생 보고'),
        fail: '드론은 끝까지 따라왔다. 별일은 없었다.',
        failRecord: '감시 드론을 따돌리려 했다',
        failPaper: null,
        extreme: '정부 공문은 오지 않았다.',
      },
    ],
  },
  {
    code: 'N05',
    title: '따라오는 개',
    roles: ['ability'],
    situation: '폐허에서 마른 개 한 마리가 계속 따라온다.',
    options: [
      {
        id: 'A',
        label: '재단까지 데려간다',
        stat: 'emp',
        result: '다음 날부터 기숙사 앞에 개가 산다는 소문이 휴게실 채널에 돈다.',
        record: '떠돌이 개를 재단에 데려왔다',
        extreme: '개에게 이름을 붙일 수 있다.',
      },
      { id: 'B', label: '정착지에 맡긴다', result: '가까운 정착지 사람이 맡아 주었다.' },
      { id: 'C', label: '먹을 것을 나눠 주고 보낸다', auto: true, result: '개는 한참 뒤를 돌아보다 떠났다.' },
    ],
  },
  {
    code: 'N09',
    title: '반쯤 남은 대피소',
    roles: ['ability'],
    situation: '지붕이 반쯤 남은 대피소를 찾았다.',
    options: [
      { id: 'A', label: '잠깐 쉬어 간다', stat: 'con', result: '오염이 조금 덜 쌓였다.', contamination: -4, extreme: '오염이 오히려 줄었다.' },
      { id: 'B', label: '보급품을 두고 간다', result: '흔적이 생겼다. 다음 사람이 쓰면 알림이 온다.' },
      { id: 'C', label: '위치만 기록한다', auto: true, result: '지도에 대피소가 표시되었다.' },
    ],
  },
  {
    code: 'N10',
    title: '끊긴 무전',
    roles: ['ability'],
    situation: '같은 구역에 있던 {동료}의 무전이 끊겼다.',
    who: { slot: '{동료}', role: 'ability', npc: '한 능력자' },
    options: [
      {
        id: 'A',
        label: '찾으러 간다',
        stat: 'dex',
        result: '{동료}는 무사했다. 무전기 배터리가 다 됐을 뿐이었다.',
        record: '{동료}를 찾으러 갔다',
        extreme: '둘 다 판독지 동행 기록에 남는다.',
      },
      { id: 'B', label: '계속 호출한다', stat: 'int', result: '잠시 뒤 {동료}의 무전이 돌아왔다.', extreme: '무전 주파수 메모를 얻었다.' },
      { id: 'C', label: '재단에 알린다', auto: true, result: '재단이 연락을 확인해 주었다.' },
    ],
  },

  // ── 재단 직원 (근무) ──
  {
    code: 'F01',
    title: '감사관',
    roles: ['staff'],
    gov: true,
    situation: '행정실에 정부 감사관이 찾아와 능력자 상담 기록 사본을 요구한다.',
    options: [
      { id: 'A', label: '규정대로 요약본만 낸다', auto: true, stat: 'edu', result: '감사관은 요약본을 받아 갔다.', extreme: '정부 공문 "자료 적정"이 남았다.' },
      { id: 'B', label: '원본을 넘긴다', result: '감사관이 만족해 돌아갔다.', record: '상담 기록 원본을 넘겼다' },
      {
        id: 'C',
        label: '담당자 부재를 이유로 미룬다',
        stat: 'emp',
        result: '감사관은 다음 주에 다시 오겠다고 했다.',
        record: '감사를 미뤘다',
        paper: gov('자료 제출 지연'),
        fail: '감사관은 기다렸다가 요약본을 받아 갔다.',
        failRecord: '감사를 미루려 했다',
        failPaper: null,
        extreme: '감사관은 다시 오지 않았다.',
      },
    ],
  },
  {
    code: 'F02',
    title: '멈춘 보일러',
    roles: ['staff'],
    situation: '대욕장 보일러가 멈췄다.',
    options: [
      {
        id: 'A',
        label: '직접 고친다',
        stat: 'craft',
        result: '반나절 걸려 고쳤다. 대욕장 복구 진행도가 올랐다.',
        record: '보일러를 직접 고쳤다',
        extreme: '대욕장 복구 진행이 크게 올랐다.',
      },
      { id: 'B', label: '오늘은 문을 닫고 공지한다', auto: true, result: '대욕장 채널에 "오늘 휴무" 공지가 걸렸다.' },
    ],
  },
  {
    code: 'F03',
    title: '밤의 방문자',
    roles: ['staff'],
    situation: '밤 근무 중, 잠들지 못한 {능력자}가 근무지에 들른다.',
    who: { slot: '{능력자}', role: 'ability', npc: '한 능력자' },
    options: [
      { id: 'A', label: '따뜻한 것을 내준다', stat: 'emp', result: '{능력자}의 다음 휴식 효과가 조금 늘었다.', extreme: '휴식 효과가 더 올랐다.' },
      {
        id: 'B',
        label: '이야기를 들어 준다',
        stat: 'mind',
        result: '밤이 깊도록 이야기를 들었다.',
        record: '밤에 찾아온 사람의 이야기를 들었다',
        extreme: '문답 "돌보는 일에서 가장 어려운 것은?"이 열렸다.',
      },
      { id: 'C', label: '의료동을 안내한다', auto: true, result: '의료동 당직에게 연결해 주었다.' },
    ],
  },
  {
    code: 'F04',
    title: '모자란 식재료',
    roles: ['staff'],
    situation: '식당 재고가 떨어져 가고 있다.',
    options: [
      { id: 'A', label: '있는 것으로 메뉴를 바꾼다', auto: true, result: '오늘의 메뉴가 "있는 것 다 넣은 수프"로 바뀌었다.' },
      { id: 'B', label: '정착지에 요청한다', stat: 'emp', result: '길 위의 부탁에 "식당 식재료 구함"이 올라갔다.', extreme: '부탁에 덤 보상이 붙었다.' },
      { id: 'C', label: '내 몫을 덜어 낸다', result: '재단 물자 하나가 식당 복구에 보태졌다.', record: '내 몫을 식당에 내놓았다' },
    ],
  },
  {
    code: 'F05',
    title: '한꺼번에 핀 아킬레아',
    roles: ['staff'],
    situation: '온실의 아킬레아가 한꺼번에 피었다.',
    options: [
      { id: 'A', label: '말려서 보관한다', auto: true, result: '아킬레아 말린 꽃을 얻었다.', item: '아킬레아 말린 꽃' },
      { id: 'B', label: '식당 테이블마다 꽂는다', result: '식당 채널 위에 "오늘 식당에 꽃이 있다"가 걸렸다.' },
      { id: 'C', label: '정착지에 보낸다', result: '정착지로 보낼 물자에 더해졌다.' },
    ],
  },

  // ── 무소속 (다녀오기) ──
  {
    code: 'T01',
    title: '두 개의 이정표',
    roles: ['free'],
    situation: '이정표 두 개가 서로 다른 길을 가리킨다. 하나는 낡았고 하나는 새로 세워졌다.',
    options: [
      { id: 'A', label: '오래된 이정표를 따른다', stat: 'int', result: '여행 지도에 전쟁 전 옛길이 한 칸 밝혀졌다.', extreme: '낡은 지도 조각을 얻었다.' },
      { id: 'B', label: '새 이정표를 따른다', auto: true, result: '길이 고르고 편했다. 예정보다 일찍 도착했다.' },
    ],
  },
  {
    code: 'T02',
    title: '소나기',
    roles: ['free'],
    situation: '갑자기 비가 쏟아진다.',
    options: [
      { id: 'A', label: '처마 밑에서 기다린다', stat: 'emp', result: '같은 처마 아래 있던 사람에게서 그 동네 이야기를 들었다. 정착지 이야기 조각 하나.', extreme: '이야기 조각을 둘 얻었다.' },
      { id: 'B', label: '그냥 걷는다', auto: true, result: '흠뻑 젖었지만 제시간에 도착했다.', record: '비를 맞으며 걸었다' },
      { id: 'C', label: '우비를 빌린다', result: '가게 주인이 우비를 빌려주었다. 길 위의 부탁에 "우비 돌려주기"가 생긴다.' },
    ],
  },
  {
    code: 'T04',
    title: '길동무',
    roles: ['free'],
    situation: '같은 방향으로 가는 {여행자}를 만났다.',
    who: { slot: '{여행자}', role: null, npc: '낯선 여행자' },
    options: [
      { id: 'A', label: '같이 걷는다', result: '함께 걸었다.', record: '{여행자}와 길을 걸었다' },
      { id: 'B', label: '목례만 하고 앞서 간다', auto: true, result: '먼저 길을 나섰다.' },
      { id: 'C', label: '지름길을 알려 준다', result: '{여행자}의 여행 지도에도 그 길이 밝혀진다.' },
    ],
  },
  {
    code: 'T05',
    title: '검문소',
    roles: ['free'],
    gov: true,
    situation: '도시 어귀의 정부 검문소에서 신분을 확인한다.',
    options: [
      { id: 'A', label: '순순히 응한다', auto: true, result: '무사히 지났다.' },
      {
        id: 'B',
        label: '다른 길로 돌아간다',
        stat: 'dex',
        result: '조금 돌아갔다. 여행 지도에 샛길이 하나 밝혀졌다.',
        record: '검문소를 피해 돌아갔다',
        fail: '돌아간 길에도 검문소가 있었다. 결국 검문에 응했다.',
        failRecord: '검문소를 피하려 했다',
        extreme: '여행 지도 칸이 둘 밝혀졌다.',
      },
      {
        id: 'C',
        label: '정착지 사람들 틈에 섞인다',
        stat: 'emp',
        result: '장을 보러 가는 사람들과 함께 지났다.',
        record: '장꾼들 틈에 섞여 검문소를 지났다',
        fail: '눈에 띄어 신분 확인을 받았다. 무사히 지났다.',
        failRecord: '장꾼들 틈에 섞이려 했다',
        extreme: '장꾼에게서 길 물건 하나를 얻었다.',
      },
    ],
  },
  {
    code: 'T06',
    title: '버려진 우체통',
    roles: ['free'],
    situation: '길가의 우체통 안에 부치지 못한 편지 몇 통이 남아 있다.',
    options: [
      { id: 'A', label: '주소의 정착지로 전한다', result: '길 위의 부탁 "오래된 편지 전하기"가 생겼다.' },
      { id: 'B', label: '그대로 둔다', auto: true, result: '우체통 뚜껑을 다시 닫아 두었다.' },
    ],
  },

  // ── 공통 ──
  {
    code: 'C01',
    title: '가방 속 고양이',
    roles: 'all',
    situation: '가방을 열었더니 길고양이가 들어가 있다.',
    options: [
      { id: 'A', label: '데려간다', stat: 'emp', result: '고양이가 순순히 따라왔다. 머무는 장소 채널에 "고양이가 생겼다"는 사건이 올라간다.' },
      { id: 'B', label: '내보낸다', auto: true, result: '고양이는 한 번 돌아보고 갔다.' },
    ],
  },
  {
    code: 'C02',
    title: '새 공고문',
    roles: 'all',
    gov: true,
    situation: '벽에 새 공고가 붙었다. "특이반응자를 신고하면 포상합니다."',
    options: [
      { id: 'A', label: '그대로 둔다', auto: true, result: '공고 앞을 지나쳤다.' },
      {
        id: 'B',
        label: '떼어 낸다',
        stat: 'dex',
        result: '아무도 못 봤다.',
        record: '신고 포상 공고를 떼어 냈다',
        fail: '순찰에게 주의를 들었다. 그 이상은 없었다.',
      },
      { id: 'C', label: '사진을 찍어 재단에 보낸다', result: '재단이 공고를 확인했다.', record: '공고를 재단에 알렸다', paper: fdn('공고 확인함') },
    ],
  },
  {
    code: 'C03',
    title: '장갑 한 짝',
    roles: 'all',
    situation: '길에 장갑 한 짝이 떨어져 있다.',
    options: [
      { id: 'A', label: '눈에 띄는 곳에 걸어 둔다', auto: true, result: '장갑을 난간에 걸어 두었다.' },
      { id: 'B', label: '주인을 찾는다', stat: 'int', result: '근처 정착지 사람의 것이었다. 고맙다며 빵을 주었다.', item: '정착지 빵' },
    ],
  },
];

/** 출동 결과 문구 (설정집 "콘텐츠 초안" 2절). 위협 종류마다 순조 둘, 고전 하나. */
export const DISPATCH_LINES: Record<'zombie' | 'mutant' | 'armed', { smooth: string[]; struggle: string }> = {
  zombie: {
    smooth: ['{캐릭터}가 {구역}의 좀비 무리를 제압했다.', '길목을 막고 있던 좀비 무리를 구역 밖으로 몰아냈다. 이동로 하나가 확보되었다.'],
    struggle: '좀비 무리가 예상보다 많았다. {캐릭터}는 일부만 제압하고 안전하게 물러났다.',
  },
  mutant: {
    smooth: ['{구역}에 자리 잡은 변이 생명체를 제압했다. 둥지 주변의 오염이 걷혔다.', '변이 식물 군락을 걷어 냈다. 막혀 있던 길이 열렸다.'],
    struggle: '변이 생명체가 자리를 옮겨 다녔다. 추적은 다음 출동으로 넘겼다.',
  },
  armed: {
    smooth: ['무장 세력의 은신처를 찾아 인원을 무력화하고 체포했다. 정부에 인계되었다.', '무장 세력이 버리고 간 거점을 확보했다. 남은 장비는 정부가 회수했다.'],
    struggle: '무장 세력이 먼저 자리를 비웠다. 거점 위치만 기록하고 돌아왔다.',
  },
};

/** 보내두기 대성공·대실패 문구 (이벤트 스크립트 9절). */
export const CRIT_LINES = {
  dispatch: { crit: '오늘은 모든 게 제자리에 있었다. {구역}의 한 구획이 통째로 걷혔다.', fumble: '집결지를 잘못 찾아갔다. 돌아오는 길에 길을 안 것만으로 위안을 삼았다.' },
  shift: { crit: '오래 고장 나 있던 것이 저절로 고쳐졌다. 아무도 이유를 모른다.', fumble: '열쇠를 두고 나왔다. 문 앞에서 기다리다 관리인이 열어 주었다.' },
  outing: { crit: '가는 곳마다 누군가 아는 체를 했다. 가방이 조금 무거워졌다.', fumble: '같은 길을 두 번 돈 것 같다. 그래도 강은 예뻤다.' },
};

/** 물품 (설정집 "콘텐츠 초안" 1절). 흔함과 가끔만 나눈다. 뽑기가 아니라 개수는 정해져 있다. */
export const ITEMS = {
  dispatch: { common: ['고철 조각', '전선 뭉치', '정화된 흙'], rare: ['표본 용기', '정화된 씨앗', '옛 표지판 조각', '색유리 조각', '멈춘 손목시계'] },
  shift: { common: ['붕대 상자', '깨끗한 담요', '통조림 묶음', '정비 공구', '수선 실타래'], rare: ['아킬레아 말린 꽃', '재단 자수 손수건', '소독약 한 병'] },
  outing: { common: ['정착지 빵', '손뜨개 장갑', '강가 조약돌', '장터 엽서', '말린 약초 다발'], rare: ['낡은 지도 조각', '정착지 배지', '손글씨 조리법 쪽지'] },
};
