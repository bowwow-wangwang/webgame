// TODO: 게임 제목이 정해지면 여기와 vite.config.ts의 PWA 이름을 함께 바꾼다.
export const GAME_TITLE = '[게임 제목]';

// 휴전 연차는 오픈일을 휴전 5년차의 시작으로 센다. 실제 값은 서버 설정(world_config)에서 온다.
export const CEASEFIRE_YEAR_AT_OPEN = 5;

// TODO: 오픈일이 정해지면 적는다 (YYYY-MM-DD, 한국 시간). 휴전 기념일 주간이 이 날짜에 시작한다. 정해지기 전에는 그 계절 갈림길이 나오지 않는다.
export const OPEN_DATE: string | null = null;
