import { useEffect, useId, useRef, useState } from 'react';
import { TEXT_LIMITS } from '../../config/balance';
import { clockKST } from '../../lib/time';
import { josa } from '../../lib/josa';
import { REPORT_REASON_LABEL, type Message, type Persona, type ReportReason } from '../../types/domain';
import { TextArea } from '../Field';
import { PickGroup } from '../Pick';
import { Px } from '../Px';
import { Sheet } from '../Sheet';

export function Face({ p, size = 44 }: { p: Persona | undefined; size?: number }) {
  if (!p?.portraitUrl) return <span className="t-chat__face t-chat__face--empty" style={{ width: size, height: size }} aria-hidden="true" />;
  return <img className="t-chat__face" src={p.portraitUrl} alt="" style={{ width: size, height: size }} />;
}

export type MsgAction =
  | { type: 'report'; message: Message }
  | { type: 'block'; persona: Persona }
  | { type: 'talk'; persona: Persona }
  | { type: 'respeak'; message: Message }
  | { type: 'delete'; message: Message };

/** 대화 목록. 읽음 표시나 답장 재촉 표시는 두지 않는다. */
export function ChatLog({ messages, onAction, canTalk }: { messages: Message[]; onAction: (a: MsgAction) => void; canTalk: boolean }) {
  const end = useRef<HTMLDivElement>(null);
  const count = messages.length;
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [count]);
  return (
    <>
      <ol className="t-chat app-chat" aria-label="대화">
        {messages.map((m) => {
          if (m.kind === 'system') {
            return (
              <li key={m.id} className="t-chat__sys">
                {m.text}
              </li>
            );
          }
          if (m.kind === 'event') {
            return (
              <li key={m.id} className="app-event">
                <Px name="radio" />
                <span>
                  <span className="t-label" style={{ display: 'block' }}>
                    {clockKST(m.at)} 장소 사건
                  </span>
                  {m.text}
                </span>
              </li>
            );
          }
          const sp = m.speaker;
          const mine = !!sp?.mine;
          const cls = ['t-chat__msg', mine ? 't-chat__msg--me' : '', m.kind === 'owner' ? 't-chat__msg--owner' : ''].filter(Boolean).join(' ');
          return (
            <li key={m.id} className={cls}>
              {m.kind === 'owner' ? <span className="t-chat__face t-chat__face--empty" aria-hidden="true" /> : <Face p={sp} />}
              <div style={{ minWidth: 0 }}>
                <div className="t-chat__head">
                  <span className="t-chat__name">
                    {m.kind === 'owner' ? `${sp?.name ?? ''}의 오너` : sp?.name}
                    {mine && m.kind !== 'owner' && ' (나)'}
                  </span>
                  {m.kind === 'owner' && <span className="t-tag t-tag--owner">오너</span>}
                  <span className="t-chat__time">{clockKST(m.at)}</span>
                  {sp && <MoreButton message={m} persona={sp} onAction={onAction} canTalk={canTalk} />}
                </div>
                <p className="t-chat__text">{m.text}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <div ref={end} />
    </>
  );
}

function fixable(m: Message) {
  return !!m.editableUntil && new Date(m.editableUntil).getTime() > Date.now();
}

/** 말마다 붙는 "더 보기". 남의 말이면 말 걸기·신고·차단, 내 말이면 보낸 직후에만 바꾸기·지우기. */
function MoreButton({ message, persona, onAction, canTalk }: { message: Message; persona: Persona; onAction: (a: MsgAction) => void; canTalk: boolean }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', close);
    };
  }, [open]);

  const items: { label: string; act: MsgAction; danger?: boolean }[] = persona.mine
    ? fixable(message)
      ? [
          { label: '다른 캐릭터로 바꾸기', act: { type: 'respeak', message } },
          { label: '지우기', act: { type: 'delete', message }, danger: true },
        ]
      : []
    : [
        ...(canTalk ? [{ label: '1:1로 말 걸기', act: { type: 'talk', persona } as MsgAction }] : []),
        { label: '신고하기', act: { type: 'report', message } },
        { label: `${persona.name}의 오너 차단하기`, act: { type: 'block', persona }, danger: true },
      ];
  if (!items.length) return null;
  return (
    <div className="app-more" ref={box}>
      <button
        type="button"
        className="app-more__btn"
        aria-label={`${persona.name}의 말 더 보기`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true">⋯</span>
      </button>
      {open && (
        <ul className="app-more__menu" id={id}>
          {items.map((it) => (
            <li key={it.label}>
              <button
                type="button"
                className={it.danger ? 'app-more__item app-more__item--danger' : 'app-more__item'}
                onClick={() => {
                  setOpen(false);
                  onAction(it.act);
                }}
              >
                {it.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** 입력줄: 지금 말하는 캐릭터를 늘 크게 보여 주고, 바꾸기는 바로 옆에 둔다. */
export function Composer({
  speaker,
  roomName,
  owner,
  onOwner,
  onSwitch,
  onSend,
  canSwitch,
}: {
  speaker: Persona | undefined;
  roomName: string;
  owner: boolean;
  onOwner: (v: boolean) => void;
  onSwitch: () => void;
  onSend: (text: string) => Promise<boolean>;
  canSwitch: boolean;
}) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const sid = useId();
  const as = owner ? '오너로' : speaker ? josa(speaker.name, '으로/로') : '';
  async function send() {
    if (!text.trim() || busy) return;
    setBusy(true);
    const ok = await onSend(text);
    setBusy(false);
    if (ok) setText('');
  }
  return (
    <form
      aria-label="말 쓰기"
      className="app-composer"
      onSubmit={(e) => {
        e.preventDefault();
        void send();
      }}
    >
      <div id={sid} className="app-composer__who">
        {owner ? <span className="t-chat__face t-chat__face--empty" style={{ width: 32, height: 32 }} aria-hidden="true" /> : <Face p={speaker} size={32} />}
        <span className="app-composer__name">
          <span className="t-muted" style={{ fontSize: 12 }}>
            지금 말하는 캐릭터
          </span>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{owner ? `${speaker?.name ?? ''}의 오너` : speaker?.name}</span>
        </span>
        {canSwitch && (
          <button className="t-btn t-btn--outline" type="button" onClick={onSwitch}>
            <b className="t-key-hint">[C]</b> 바꾸기
          </button>
        )}
        <button className="t-btn t-btn--outline" type="button" aria-pressed={owner} onClick={() => onOwner(!owner)} style={owner ? undefined : { color: 'var(--ink-muted)' }}>
          오너
        </button>
      </div>
      <div className="app-composer__row">
        <label htmlFor={`${sid}-t`} className="t-sr">
          {as} {roomName}에 말하기
        </label>
        <textarea
          id={`${sid}-t`}
          className="t-input app-composer__input"
          rows={1}
          value={text}
          placeholder={`${as} 말하기`}
          aria-describedby={sid}
          maxLength={TEXT_LIMITS.message * 2}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Enter는 보내기, Shift+Enter는 줄바꿈. 한글 조합 중에는 보내지 않는다.
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <button type="submit" className="t-btn t-btn--solid" disabled={!text.trim()} aria-busy={busy || undefined} style={{ minHeight: 48 }}>
          보내기
        </button>
      </div>
    </form>
  );
}

/** 말하는 캐릭터 고르기. 바꾸면 바로 입력줄 위 표시가 바뀐다. */
export function SpeakerSheet({ characters, current, title, onPick, onClose }: { characters: Persona[]; current: string | undefined; title: string; onPick: (id: string) => void; onClose: () => void }) {
  return (
    <Sheet title={title} onClose={onClose} labelId="speaker-t">
      <PickGroup
        legend="내 캐릭터"
        row
        value={current ?? null}
        onChange={(id) => onPick(id)}
        options={characters.map((c) => ({ value: c.id, title: c.name }))}
      />
      <div className="t-dialog__actions" style={{ gridTemplateColumns: '1fr' }}>
        <button className="t-btn t-btn--outline" type="button" onClick={onClose}>
          닫기
        </button>
      </div>
    </Sheet>
  );
}

/** 신고: 이유 하나와 덧붙일 말(선택). 보낸 뒤 결과는 알림 띠로 알린다. */
export function ReportSheet({ target, onSubmit, onClose }: { target: Persona; onSubmit: (reason: ReportReason, memo: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [memo, setMemo] = useState('');
  return (
    <Sheet title={`${target.name}의 말 신고하기`} onClose={onClose} labelId="report-t" tone="danger">
      <PickGroup<ReportReason>
        legend="어떤 문제인가요"
        row
        value={reason}
        onChange={setReason}
        options={(Object.keys(REPORT_REASON_LABEL) as ReportReason[]).map((r) => ({ value: r, title: REPORT_REASON_LABEL[r] }))}
      />
      <TextArea label="덧붙일 말" optional="쓰지 않아도 돼요" value={memo} onChange={setMemo} max={200} rows={2} />
      <p className="t-field__help" style={{ margin: 0 }}>
        신고한 사람은 상대에게 알려지지 않아요. 운영자가 확인하고, 처리한 내용은 기록으로 남아요.
      </p>
      <div className="t-dialog__actions">
        <button className="t-btn t-btn--outline" type="button" onClick={onClose}>
          그만두기
        </button>
        <button className="t-btn t-btn--danger" type="button" disabled={!reason} onClick={() => reason && onSubmit(reason, memo)}>
          신고 보내기
        </button>
      </div>
    </Sheet>
  );
}
