// 게임의 시각은 늘 한국 시간으로 보여 준다 (기기의 시간대와 상관없이).
const TZ = 'Asia/Seoul';

export function clockKST(d: Date | string) {
  return new Date(d).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ });
}

export function remaining(endsAt: string, now = Date.now()) {
  const ms = Math.max(0, new Date(endsAt).getTime() - now);
  const h = Math.floor(ms / 3600_000);
  const m = Math.floor((ms % 3600_000) / 60_000);
  return `${h}:${String(m).padStart(2, '0')}`;
}

export function dateKST(d: Date = new Date()) {
  const p = new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric', timeZone: TZ }).formatToParts(d);
  const m = p.find((x) => x.type === 'month')?.value ?? '';
  const day = p.find((x) => x.type === 'day')?.value ?? '';
  return { month: Number(m), day: Number(day) };
}

/** "방금", "12분 전", "3시간 전". 하루가 넘으면 날짜. */
export function ago(iso: string, now = Date.now()) {
  const min = Math.floor((now - new Date(iso).getTime()) / 60_000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  if (min < 24 * 60) return `${Math.floor(min / 60)}시간 전`;
  const { month, day } = dateKST(new Date(iso));
  return `${month}월 ${day}일`;
}
