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
  // 이 시간에는 알림을 보내지 않고 아침에 묶어 보낸다 (한국 시간).
  quietHours: { start: '23:00', end: '08:00' },
} as const;

// 글자 수 상한. 문답 60자만 설정집 초안이고 나머지는 운영자 확인 전의 초안이다 (화면설계서 "정해야 할 것").
export const TEXT_LIMITS = {
  name: 20,
  look: 1000,
  personality: 1000,
  past: 2000,
  ability: 500,
  imageAlt: 100,
  qnaAnswer: 60,
  passwordMin: 8,
} as const;
