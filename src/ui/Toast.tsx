import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

type Kind = 'ok' | 'info' | 'danger';
interface ToastItem {
  id: number;
  kind: Kind;
  text: string;
  action?: { label: string; run: () => void };
}

const Ctx = createContext<(t: Omit<ToastItem, 'id'>) => void>(() => {});

/** 알림 띠. 한 번에 하나만 보인다. 실패는 닫을 때까지 남는다. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [item, setItem] = useState<ToastItem | null>(null);
  const n = useRef(0);
  const show = useCallback((t: Omit<ToastItem, 'id'>) => setItem({ ...t, id: ++n.current }), []);

  useEffect(() => {
    if (!item || item.kind === 'danger') return;
    const t = setTimeout(() => setItem(null), item.kind === 'ok' ? 4000 : 6000);
    return () => clearTimeout(t);
  }, [item]);

  return (
    <Ctx.Provider value={show}>
      {children}
      <div className="app-toasts">
        {item && (
          <div key={item.id} className={item.kind === 'info' ? 't-toast' : `t-toast t-toast--${item.kind}`} role={item.kind === 'danger' ? 'alert' : 'status'}>
            <span className="t-toast__text">{item.text}</span>
            {item.action && (
              <button
                className="t-btn t-btn--outline"
                type="button"
                onClick={() => {
                  item.action?.run();
                  setItem(null);
                }}
              >
                {item.action.label}
              </button>
            )}
            <button className="t-toast__close" type="button" aria-label="알림 닫기" onClick={() => setItem(null)}>
              ×
            </button>
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
