import { useEffect, useId, useState } from 'react';
import { BALANCE } from '../../config/balance';
import {
  CONFIG_GROUPS,
  DEFAULT_CONFIG,
  FIXED_VALUES,
  checkGroup,
  diffGroup,
  getAt,
  same,
  setAt,
  showValue,
  type ConfigField,
  type ConfigGroup,
  type WorldConfig,
} from '../../config/worldConfig';
import { api } from '../../services';
import { Loading } from '../../ui/Loading';
import { Px } from '../../ui/Px';
import { Sheet } from '../../ui/Sheet';
import { useToast } from '../../ui/Toast';
import { AdminFrame } from './AdminScreens';

// 입력 중인 글자는 그대로 두고(지우고 다시 쓰는 중일 수 있다), 검사와 저장 때만 숫자로 바꾼다.
type Raw = Record<string, string>;
const SEASON_PARTS = [
  ['month', '월'],
  ['day', '일'],
  ['days', '기간(일)'],
] as const;

function toRaw(f: ConfigField, v: unknown): Raw {
  switch (f.kind) {
    case 'byHours':
      return Object.fromEntries(BALANCE.sendHours.map((h) => [`${f.path}.${h}`, String((v as Record<number, number>)[h] ?? '')]));
    case 'season':
      return Object.fromEntries(SEASON_PARTS.map(([k]) => [`${f.path}.${k}`, String((v as Record<string, number>)[k] ?? '')]));
    case 'date':
      return { [f.path]: (v as string | null) ?? '' };
    case 'list':
      return { [f.path]: (v as number[]).join(', ') };
    default:
      return { [f.path]: String(v) };
  }
}

const num = (s: string | undefined) => (s === undefined || s.trim() === '' ? NaN : Number(s.trim()));

function fromRaw(f: ConfigField, raw: Raw): unknown {
  switch (f.kind) {
    case 'byHours':
      return Object.fromEntries(BALANCE.sendHours.map((h) => [h, num(raw[`${f.path}.${h}`])]));
    case 'season':
      return Object.fromEntries(SEASON_PARTS.map(([k]) => [k, num(raw[`${f.path}.${k}`])]));
    case 'date':
      return raw[f.path] ? raw[f.path] : null;
    case 'list':
      return (raw[f.path] ?? '')
        .split(/[,\s]+/)
        .filter(Boolean)
        .map(Number);
    default:
      return num(raw[f.path]);
  }
}

const rawOf = (g: ConfigGroup, cfg: WorldConfig): Raw => Object.assign({}, ...g.fields.map((f) => toRaw(f, getAt(cfg, f.path))));
const cfgOf = (g: ConfigGroup, base: WorldConfig, raw: Raw) => g.fields.reduce((c, f) => setAt(c, f.path, fromRaw(f, raw)), base);

function FieldInput({ f, raw, setRaw, error }: { f: ConfigField; raw: Raw; setRaw: (k: string, v: string) => void; error?: string }) {
  const id = useId();
  const errId = `${id}-e`;
  const helpId = `${id}-h`;
  const described = [error ? errId : '', f.help ? helpId : ''].filter(Boolean).join(' ') || undefined;
  const decimal = f.kind === 'prob' || (f.kind === 'byHours' && f.max === 1);
  const box = (key: string, label: string) => (
    <label className="app-cfg__part" key={key}>
      <span>{label}</span>
      <input
        className="t-input"
        inputMode={decimal ? 'decimal' : 'numeric'}
        value={raw[key] ?? ''}
        aria-invalid={error ? true : undefined}
        aria-describedby={described}
        onChange={(e) => setRaw(key, e.target.value)}
      />
    </label>
  );
  const unit = f.unit && f.kind !== 'list' ? <span className="app-cfg__unit">{f.unit}</span> : null;
  return (
    <div className="app-cfg__input">
      {f.kind === 'byHours' ? (
        <fieldset className="app-cfg__parts">
          <legend className="t-sr">{f.label}</legend>
          {BALANCE.sendHours.map((h) => box(`${f.path}.${h}`, `${h}시간`))}
        </fieldset>
      ) : f.kind === 'season' ? (
        <fieldset className="app-cfg__parts">
          <legend className="t-sr">{f.label}</legend>
          {SEASON_PARTS.map(([k, l]) => box(`${f.path}.${k}`, l))}
        </fieldset>
      ) : (
        <div className="app-cfg__one">
          <input
            id={id}
            className="t-input"
            type={f.kind === 'date' ? 'date' : 'text'}
            inputMode={f.kind === 'date' || f.kind === 'list' ? undefined : decimal ? 'decimal' : 'numeric'}
            value={raw[f.path] ?? ''}
            aria-label={f.label}
            aria-invalid={error ? true : undefined}
            aria-describedby={described}
            onChange={(e) => setRaw(f.path, e.target.value)}
          />
          {unit}
        </div>
      )}
      {error && (
        <p className="t-field__error" id={errId} role="alert">
          <Px name="warning" small />
          {error}
        </p>
      )}
      {f.help && (
        <p className="t-field__help" id={helpId}>
          {f.help}
        </p>
      )}
    </div>
  );
}

function GroupEditor({ g, cfg, onSaved }: { g: ConfigGroup; cfg: WorldConfig; onSaved: (c: WorldConfig) => void }) {
  const toast = useToast();
  const [raw, setRawState] = useState<Raw>(() => rawOf(g, cfg));
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => setRawState(rawOf(g, cfg)), [g, cfg]);

  const draft = cfgOf(g, cfg, raw);
  const errs = checkGroup(g, draft);
  const changes = diffGroup(g, cfg, draft);
  const dirty = !same(raw, rawOf(g, cfg));
  const setRaw = (k: string, v: string) => setRawState((r) => ({ ...r, [k]: v }));
  const hasErr = Object.keys(errs).length > 0;

  async function save() {
    setBusy(true);
    const r = await api.saveWorldConfig(g.id, draft);
    setBusy(false);
    setConfirm(false);
    if (!r.ok) return toast({ kind: 'danger', text: r.message });
    toast({ kind: 'ok', text: `${g.title} 설정을 저장했어요.` });
    onSaved(r.value);
  }

  const hid = `cfg-${g.id}`;
  return (
    <section aria-labelledby={hid} className="app-setting app-cfg">
      <h2 id={hid} className="app-cfg__title">
        {g.title}
      </h2>
      <p className="t-field__help" style={{ margin: 0 }}>
        {g.note}
      </p>
      <div className="app-cfg__list">
        {g.fields.map((f) => {
          const def = getAt(DEFAULT_CONFIG, f.path);
          const now = getAt(draft, f.path);
          const off = !errs[f.path] && !same(def, now);
          return (
            <div className="app-cfg__row" key={f.path}>
              <div className="app-cfg__head">
                <span className="app-cfg__label">{f.label}</span>
                {off && (
                  <span className="app-cfg__def">
                    <span className="t-status t-status--info">기본값과 다름</span>
                    <button type="button" className="t-btn t-btn--ghost" onClick={() => setRawState((r) => ({ ...r, ...toRaw(f, def) }))}>
                      기본값 {showValue(f, def)}으로
                    </button>
                  </span>
                )}
              </div>
              <FieldInput f={f} raw={raw} setRaw={setRaw} error={errs[f.path]} />
            </div>
          );
        })}
      </div>
      <div className="app-mod-actions">
        <button className="t-btn t-btn--solid" type="button" disabled={!changes.length || hasErr || busy} onClick={() => setConfirm(true)}>
          {g.title} 저장
        </button>
        {dirty && (
          <button className="t-btn t-btn--outline" type="button" onClick={() => setRawState(rawOf(g, cfg))}>
            고친 것 되돌리기
          </button>
        )}
      </div>
      {confirm && (
        <Sheet title={`${g.title} 설정을 바꿀까요?`} onClose={() => setConfirm(false)} labelId={`${hid}-confirm`}>
          <ul className="app-cfg__diff">
            {changes.map((c) => (
              <li key={c.path}>
                <b>{c.label}</b>
                <span>
                  {c.from} → {c.to}
                </span>
              </li>
            ))}
          </ul>
          <p className="t-field__help" style={{ margin: 0 }}>
            {g.note} 바꾼 내용은 조치 기록에 남아요.
          </p>
          <div className="t-dialog__actions">
            <button className="t-btn t-btn--outline" type="button" onClick={() => setConfirm(false)}>
              그만두기
            </button>
            <button className="t-btn t-btn--solid" type="button" disabled={busy} onClick={() => void save()}>
              저장하기
            </button>
          </div>
        </Sheet>
      )}
    </section>
  );
}

/** 운영: 서버 설정값. 묶음마다 따로 저장한다. */
export function ConfigScreen() {
  const [cfg, setCfg] = useState<WorldConfig | null>(null);
  useEffect(() => {
    void api.getWorldConfig().then(setCfg);
  }, []);
  return (
    <AdminFrame title="신고와 조치">
      {!cfg ? (
        <Loading text="서버 설정을 불러오는 중" />
      ) : (
        <>
          <p className="t-field__help" style={{ margin: 0 }}>
            지금 값은 모두 초안이에요. 저장하면 서버 전체에 바로 적용되고, 플레이어에게 따로 알리지는 않아요.
          </p>
          {CONFIG_GROUPS.map((g) => (
            <GroupEditor key={g.id} g={g} cfg={cfg} onSaved={setCfg} />
          ))}
          <section aria-labelledby="cfg-fixed" className="app-setting app-cfg">
            <h2 id="cfg-fixed" className="app-cfg__title">
              바꿀 수 없는 값
            </h2>
            <p className="t-field__help" style={{ margin: 0 }}>
              이미 만든 캐릭터와 저장소 정책에 묶여 있어서 여기서는 보기만 해요. 바꾸려면 코드와 서버 정책을 함께 고쳐야 해요.
            </p>
            <div className="t-cells" style={{ gridTemplateColumns: '1fr' }}>
              {FIXED_VALUES.map((v) => (
                <div className="t-cell" key={v.label}>
                  <span className="t-cell__k">{v.label}</span>
                  <span className="t-cell__v">{v.value}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </AdminFrame>
  );
}
