// 운영자가 숨기거나 지운 판독지 글, 이미지, 문답 답의 상태. 여러 가짜 서비스가 함께 본다.
// 진짜 서버에서는 각 테이블의 숨김 여부 칸이 맡고, 다른 사람에게 내려줄 때 서버가 빼고 준다.
import type { Persona } from '../types/domain';

export type Veil = 'hidden' | 'deleted';

const KEY = 'webgame.mock.moderation.v1';
let veils: Record<string, Veil> = {};
try {
  veils = JSON.parse(sessionStorage.getItem(KEY) ?? '{}') as Record<string, Veil>;
} catch {
  // 새로 시작
}

// 사진은 대화, 명부, 판독지가 같은 인물 정보를 쓰므로 원본을 기억해 두고 한꺼번에 바꾼다.
const lists: Persona[][] = [];
const originals = new Map<string, string | null>();

function sync() {
  for (const list of lists)
    for (const p of list) p.portraitUrl = veils[`${p.id}-image`] ? null : (originals.get(p.id) ?? null);
}

export const moderation = {
  veil: (targetId: string): Veil | null => veils[targetId] ?? null,
  set(targetId: string, v: Veil | null) {
    if (v) veils[targetId] = v;
    else delete veils[targetId];
    try {
      sessionStorage.setItem(KEY, JSON.stringify(veils));
    } catch {
      // 이번 창에서는 쓸 수 있다
    }
    sync();
  },
  registerPersonas(list: Persona[]) {
    for (const p of list) if (!originals.has(p.id)) originals.set(p.id, p.portraitUrl);
    lists.push(list);
    sync();
  },
  /** 운영자는 숨긴 이미지도 본다. */
  originalPortrait: (personaId: string) => originals.get(personaId) ?? null,
};
