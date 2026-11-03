// 갈림길·물품·출동 문구 시드의 모양. 갈림길 목록은 scripts/gen-forks.mjs가 docs/content/이벤트 스크립트.md에서
// forks.generated.ts로 만든다 (판정 능력치와 극단적 성공·실패 문구는 같은 문서 9절 판정표). 물품과 출동 문구는 콘텐츠 초안 탭.
// 진짜 서버에서는 같은 내용이 choice_events / choice_options 등의 시드 마이그레이션으로 들어간다.
import type { PaperNote, Role, StatKey } from '../../types/domain';


export interface OptionSeed {
  id: 'A' | 'B' | 'C';
  label: string;
  auto?: boolean;
  stat?: StatKey;
  /** "전문 또는 지능 중 높은 쪽"처럼 둘 중 높은 능력치로 판정한다. */
  statAlt?: StatKey;
  result: string;
  record?: string;
  paper?: PaperNote;
  /** 판정에 실패했을 때. 없으면 결과 끝에 "생각보다 오래 걸렸다."를 붙인다. */
  fail?: string;
  failRecord?: string | null;
  failPaper?: PaperNote | null;
  /** 극단적 성공이면 덧붙는 결과. */
  extreme?: string;
  extremeItem?: string;
  /** 능력자의 오염 변화. 다른 역할이 고르면 오염 대신 덤 하나를 포기한다. */
  contamination?: number;
  /** 실패했을 때 능력자에게 더 쌓이는 오염. */
  failContamination?: number;
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
  /** 계절 갈림길: 그 기간에만 나온다 (기간은 balance.ts DAY.seasons). */
  season?: 'snow' | 'rain' | 'truce';
  /** 출신 정착지가 있는 캐릭터에게만 나온다. */
  requires?: 'origin';
  options: OptionSeed[];
}

export { FORKS } from './forks.generated';

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
  dispatch: { common: ['고철 조각', '전선 뭉치', '정화된 흙', '녹슨 못 한 줌', '찢어진 방수포'], rare: ['표본 용기', '정화된 씨앗', '옛 표지판 조각', '색유리 조각', '멈춘 손목시계'] },
  shift: { common: ['붕대 상자', '깨끗한 담요', '통조림 묶음', '정비 공구', '수선 실타래'], rare: ['아킬레아 말린 꽃', '재단 자수 손수건', '소독약 한 병'] },
  outing: { common: ['정착지 빵', '손뜨개 장갑', '강가 조약돌', '장터 엽서', '말린 약초 다발'], rare: ['낡은 지도 조각', '정착지 배지', '손글씨 조리법 쪽지'] },
};
