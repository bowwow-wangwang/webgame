import { useEffect, useRef, type ReactNode } from 'react';

/**
 * 화면 위에 잠깐 여는 판(신고, 말하는 캐릭터 고르기, 약관 읽기).
 * ESC와 바깥 누르기로 닫고, 열려 있는 동안 초점은 판 안에서만 돈다.
 */
export function Sheet({ title, onClose, children, tone = 'plain', labelId }: { title: string; onClose: () => void; children: ReactNode; tone?: 'plain' | 'danger'; labelId: string }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const first = box.current?.querySelector<HTMLElement>('[autofocus], button, [href], input, textarea, select');
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab' || !box.current) return;
      const f = [...box.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, textarea, select, [tabindex="0"]')];
      const a = f[0];
      const z = f.at(-1);
      if (!a || !z) return;
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault();
        a.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus();
    };
  }, [onClose]);
  return (
    <div className="t-dialog-backdrop app-sheet" onClick={onClose}>
      <div
        ref={box}
        className={tone === 'plain' ? 't-dialog app-dialog--plain' : 't-dialog'}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="t-dialog__body">
          <h2 id={labelId} className="t-dialog__title">
            {title}
          </h2>
          {children}
        </div>
      </div>
    </div>
  );
}
