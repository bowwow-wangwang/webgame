// 조사를 이름의 받침에 맞춰 고른다 ("출동을", "근무를", "휴게실로"). 서버 문구도 같은 규칙을 쓴다.
type Pair = '을/를' | '이/가' | '은/는' | '와/과' | '으로/로';

function lastHangul(word: string) {
  const ch = word.trim().at(-1) ?? '';
  const code = ch.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return null;
  return code % 28; // 0이면 받침 없음, 8이면 ㄹ 받침
}

export function josa(word: string, pair: Pair): string {
  const jong = lastHangul(word);
  const [withFinal, withoutFinal] = pair.split('/') as [string, string];
  if (jong === null) return word + withFinal.replace(/^으/, '');
  if (pair === '으로/로') return word + (jong === 0 || jong === 8 ? '로' : '으로');
  if (pair === '와/과') return word + (jong === 0 ? '와' : '과');
  return word + (jong === 0 ? withoutFinal : withFinal);
}
