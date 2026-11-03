// 서버 설정 테이블 world_config와 같은 값이어야 한다 (CLAUDE.md "밸런스 수치는 한 곳에").
// 화면은 이 값을 미리 보여 주고 버튼을 끄는 데만 쓴다. 최종 검사는 늘 서버가 한다.
export const BALANCE = {
  maxCharactersPerAccount: 3,
  statBase: 30,
  statPool: 100,
  statCapAtCreation: 60,
  imagesPerCharacter: 3,
  imageMaxBytes: 500_000,
  imageLongEdge: 1024,
  sendHours: [1, 4, 8] as const,
  // 다른 캐릭터로 잘못 보낸 말을 바꾸거나 지울 수 있는 시간.
  messageFixMinutes: 2,
  // 이 시간에는 알림을 보내지 않고 아침에 묶어 보낸다 (한국 시간).
  quietHours: { start: '23:00', end: '08:00' },
  /** 초안: 같은 대상에 신고가 이만큼 쌓이면 운영자 확인 전까지 자동으로 숨긴다. */
  reportAutoHide: 3,
  /** 초안: 기간 정지에서 고를 수 있는 날 수. */
  suspendDays: [1, 3, 7, 30],
} as const;

// 글자 수 상한. 문답 60자만 설정집 초안이고 나머지는 운영자 확인 전의 초안이다 (화면설계서 "정해야 할 것").
export const TEXT_LIMITS = {
  name: 20,
  look: 1000,
  personality: 1000,
  past: 2000,
  ability: 500,
  preRecordItem: 40,
  imageAlt: 100,
  qnaAnswer: 60,
  message: 1000,
  passwordMin: 8,
} as const;

/**
 * 하루 한 바퀴의 밸런스. **모두 초안**이다: 운영자가 정하기 전까지 화면을 돌려 보려고 넣은 값.
 * 서버 쪽 world_config와 같은 이름, 같은 값을 쓴다. 시간별 값은 보내두기 시간(1·4·8) 순서다.
 */
export const DAY = {
  /** 판정: 01은 대성공, 96~100은 대실패 (docs/systems/daily.md 4-1-1). */
  critMax: 1,
  fumbleMin: 96,
  /** 오염이 이 값 이상이면 능력자의 판정 수치가 내려간다. */
  cautionAt: 70,
  cautionPenalty: 5,
  overloadAt: 100,
  /** 폭주하면 이 시간 동안 출동할 수 없다. 쉬어서 이 값 아래로 내려가면 바로 풀린다. */
  overloadHours: 12,
  overloadClearBelow: 50,
  /** 시간이 지나면 저절로 조금씩 줄어든다 (시간당). */
  naturalDecayPerHour: 1,
  /** 출동 한 번에 쌓이는 오염. */
  dispatchContamination: { 1: 8, 4: 18, 8: 28 } as Record<number, number>,
  /** 출동이 고전이면 더 쌓인다. */
  struggleExtra: 4,
  /** "버티며 신중하게"에 성공하면 덜 쌓인다. */
  steadyRelief: 5,
  /** "능력을 아끼지 않는다". */
  boostContamination: 8,
  boostContribution: 2,
  /** 밀어붙이기의 대가 (능력자). */
  pushContamination: 6,
  /** 정화 기여 (구역 정화율 %). 고전이면 1 적다. */
  contribution: { 1: 1, 4: 3, 8: 5 } as Record<number, number>,
  /** 근무 한 번의 시설 복구 진행. */
  facilityProgress: { 1: 2, 4: 6, 8: 10 } as Record<number, number>,
  /** 다녀오기 한 번에 밝혀지는 여행 지도 칸. */
  mapCells: { 1: 1, 4: 2, 8: 3 } as Record<number, number>,
  /** 흔한 물품 개수. 8시간은 "가끔" 물품 하나가 더 붙는다. */
  commonItems: { 1: 1, 4: 2, 8: 3 } as Record<number, number>,
  /** 휴식으로 줄어드는 오염. */
  restRelief: { 1: 12, 4: 30, 8: 50 } as Record<number, number>,
  /** 함께 쉬기: 같은 시간에 같은 곳에 다른 계정 캐릭터가 있으면. */
  togetherBonus: 0.2,
  /** 갈림길이 올 확률 (8시간은 하나 확정, 둘째는 아직 만들지 않았다). */
  forkChance: { 1: 0.3, 4: 0.6, 8: 1 } as Record<number, number>,
  growthCap: 80,
  /** 계절 갈림길이 나오는 기간 (한국 시간, 월·일과 날 수). 휴전 기념일 주간은 오픈일(game.ts)에서 시작한다. */
  seasons: {
    snow: { month: 12, day: 1, days: 7 },
    rain: { month: 6, day: 22, days: 21 },
    truceDays: 7,
  },
} as const;
