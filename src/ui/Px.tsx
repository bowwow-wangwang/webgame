import { PIXEL_ICONS, type PixelIconName } from './pixelIcons';

const INK = ['px-a', 'px-b', 'px-c'] as const;

/** 픽셀 아이콘. 뜻은 늘 옆의 글자가 전하므로 화면 낭독기에서는 숨긴다. */
export function Px({ name, small }: { name: PixelIconName; small?: boolean }) {
  return (
    <svg className={small ? 't-px t-px--sm' : 't-px'} viewBox="0 0 16 16" aria-hidden="true">
      {PIXEL_ICONS[name].map(([ink, x, y, w, h], i) => (
        <rect key={i} className={INK[ink]} x={x} y={y} width={w} height={h} />
      ))}
    </svg>
  );
}
