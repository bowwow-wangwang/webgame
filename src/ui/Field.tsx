import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { Px } from './Px';

interface Common {
  label: ReactNode;
  optional?: string;
  help?: ReactNode;
  error?: string | null;
  ok?: string | null;
  /** 글자 수 상한. 있으면 "n / 상한"을 늘 보여 준다. */
  max?: number;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
}

function useDescribers(id: string, p: Common) {
  const ids = {
    count: `${id}-c`,
    help: `${id}-h`,
    err: `${id}-e`,
    ok: `${id}-o`,
  };
  const describedBy =
    [p.max ? ids.count : '', p.error ? ids.err : '', p.ok ? ids.ok : '', p.help ? ids.help : ''].filter(Boolean).join(' ') || undefined;
  return { ids, describedBy };
}

function Head({ id, p, countId }: { id: string; p: Common; countId: string }) {
  const len = [...p.value].length;
  const over = p.max !== undefined && len > p.max;
  return (
    <div className="t-field__head">
      <label className="t-field__label" htmlFor={id}>
        {p.label}
        {p.optional && <span className="t-field__opt">{p.optional}</span>}
      </label>
      {p.max !== undefined && (
        <span className="t-field__count" id={countId} style={over ? { color: 'var(--stamp)' } : undefined}>
          {len} / {p.max}
          <span className="t-sr">자</span>
        </span>
      )}
    </div>
  );
}

function Tail({ p, ids }: { p: Common; ids: Record<'help' | 'err' | 'ok', string> }) {
  return (
    <>
      {p.error && (
        <p className="t-field__error" id={ids.err} role="alert">
          <Px name="warning" small />
          {p.error}
        </p>
      )}
      {p.ok && (
        <p className="t-field__ok" id={ids.ok}>
          {p.ok}
        </p>
      )}
      {p.help && (
        <p className="t-field__help" id={ids.help}>
          {p.help}
        </p>
      )}
    </>
  );
}

export function TextField(
  p: Common & { type?: string; placeholder?: string; autoComplete?: string; trailing?: ReactNode; inputProps?: InputHTMLAttributes<HTMLInputElement> },
) {
  const id = useId();
  const { ids, describedBy } = useDescribers(id, p);
  const input = (
    <input
      id={id}
      className="t-input"
      type={p.type ?? 'text'}
      value={p.value}
      placeholder={p.placeholder}
      autoComplete={p.autoComplete}
      aria-describedby={describedBy}
      aria-invalid={p.error ? true : undefined}
      onChange={(e) => p.onChange(e.target.value)}
      onBlur={p.onBlur}
      {...p.inputProps}
    />
  );
  return (
    <div className="t-field">
      <Head id={id} p={p} countId={ids.count} />
      {p.trailing ? (
        <div className="t-field__row">
          {input}
          {p.trailing}
        </div>
      ) : (
        input
      )}
      <Tail p={p} ids={ids} />
    </div>
  );
}

/** 긴 글 칸. 줄바꿈과 이모지를 받고, 상한을 넘어도 막지 않고 숫자로 알린다 (입력은 너그럽게). */
export function TextArea(p: Common & { placeholder?: string; rows?: number }) {
  const id = useId();
  const { ids, describedBy } = useDescribers(id, p);
  return (
    <div className="t-field">
      <Head id={id} p={p} countId={ids.count} />
      <textarea
        id={id}
        className="t-input t-input--area"
        rows={p.rows ?? 4}
        value={p.value}
        placeholder={p.placeholder}
        aria-describedby={describedBy}
        aria-invalid={p.error ? true : undefined}
        onChange={(e) => p.onChange(e.target.value)}
        onBlur={p.onBlur}
      />
      <Tail p={p} ids={ids} />
    </div>
  );
}

export function SelectField({
  label,
  optional,
  value,
  onChange,
  options,
}: {
  label: string;
  optional?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const id = useId();
  return (
    <div className="t-field">
      <div className="t-field__head">
        <label className="t-field__label" htmlFor={id}>
          {label}
          {optional && <span className="t-field__opt">{optional}</span>}
        </label>
      </div>
      <select id={id} className="t-input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
