import { useId } from 'react';
import { GOV_EMBLEM_INNER, GOV_STAMP_INNER } from './marksArt';

// 그림은 저장소에 있는 정적 SVG라 이용자 입력이 섞이지 않는다. 그래서 innerHTML로 넣어도 안전하다.
export function GovEmblem({ label = '오르덴 공화국 문장' }: { label?: string }) {
  return (
    <svg
      className="t-mark"
      viewBox="0 0 64 64"
      role="img"
      aria-label={label}
      fill="none"
      stroke="currentColor"
      dangerouslySetInnerHTML={{ __html: GOV_EMBLEM_INNER }}
    />
  );
}

/** 원형 직인. 둘레 글자는 고정된 시스템 문구만 받는다. */
export function GovStamp({ top = '오르덴 공화국', bottom = '관리 등록' }: { top?: '오르덴 공화국'; bottom?: '관리 등록' | '기록 종결' }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const inner = GOV_STAMP_INNER.replaceAll('{UID}', `s${uid}`).replace('{TOP}', top).replace('{BOTTOM}', bottom);
  return (
    <svg
      className="t-roundstamp"
      viewBox="0 0 100 100"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
