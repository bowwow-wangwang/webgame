import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { useSession } from '../../lib/session';
import { clockKST, remaining } from '../../lib/time';
import { josa } from '../../lib/josa';
import { api } from '../../services';
import { Frame, ScreenHeader } from '../../shell/Frame';
import { ConditionStatus, ContaminationGauge } from '../../ui/Gauge';
import { Loading } from '../../ui/Loading';
import { PickGroup } from '../../ui/Pick';
import { Px } from '../../ui/Px';
import { RollReadout } from '../../ui/Readout';
import { useToast } from '../../ui/Toast';
import { Face } from '../../ui/chat/Chat';
import {
  GRADE_LABEL,
  ROLE_LABEL,
  SEND_KIND_LABEL,
  isSuccess,
  type ActiveSend,
  type Character,
  type Condition,
  type Fork,
  type ForkOutcome,
  type Persona,
  type RestKind,
  type RestOptions,
  type SendResult,
} from '../../types/domain';

const persona = (c: Character): Persona => ({ id: c.id, name: c.name, role: c.role, portraitUrl: c.portraitUrl, mine: true });

/** 출동은 정부가 내미는 화면이다: 색은 단말 그대로 두고 맨 위 경계 띠와 "정부 회선" 꼬리표만 단다. */
function GovLine() {
  return (
    <span className="t-tag t-tag--gov" style={{ whiteSpace: 'nowrap' }}>
      정부 회선
    </span>
  );
}
function GovBand() {
  return <div className="t-hazard t-hazard--thin" aria-hidden="true" style={{ margin: '-16px -14px 0' }} />;
}

function useSends(): [ActiveSend[] | null, () => Promise<void>] {
  const [sends, setSends] = useState<ActiveSend[] | null>(null);
  const reload = useCallback(async () => setSends(await api.listMySends()), []);
  useEffect(() => {
    void reload();
  }, [reload]);
  return [sends, reload];
}

/** 남은 시간을 1분마다 다시 그린다. */
function useMinuteTick() {
  const [, setT] = useState(0);
  useEffect(() => {
    const h = window.setInterval(() => setT((x) => x + 1), 30_000);
    return () => window.clearInterval(h);
  }, []);
}

function latestOf(sends: ActiveSend[], characterId: string) {
  return [...sends].reverse().find((s) => s.characterId === characterId);
}
const isRunning = (s: ActiveSend) => new Date(s.endsAt).getTime() > Date.now();

/** 캐릭터 하나의 지금 할 일 하나 (힉의 법칙: 칸마다 주요 버튼 하나). */
export function nextStep(c: Character, s: ActiveSend | undefined, cond: Condition | undefined): { to: string; label: string; tag: string } {
  if (s?.forkWaiting) return { to: `/run/${s.id}`, label: '갈림길 고르기', tag: '갈림길' };
  if (s && isRunning(s)) return { to: `/run/${s.id}`, label: '진행 보기', tag: '진행' };
  if (s?.unseen) return { to: `/result/${s.id}`, label: '결과 보기', tag: '결과' };
  if (c.role === 'ability' && cond && (cond.level !== 'calm' || (cond.contamination ?? 0) >= 40)) return { to: `/rest/${c.id}`, label: '휴식하러 가기', tag: '휴식' };
  return { to: `/send/${c.id}`, label: `${c.role === 'ability' ? '출동' : c.role === 'staff' ? '근무' : '다녀오기'} 보내기`, tag: '보내기' };
}

export function statusLine(s: ActiveSend | undefined) {
  if (!s) return '보내 둔 일 없음';
  const kind = SEND_KIND_LABEL[s.kind];
  if (s.forkWaiting) return `${s.targetName} ${kind} 중, 갈림길이 왔어요`;
  if (isRunning(s)) return `${s.targetName} ${kind} 중, ${remaining(s.endsAt)} 남음`;
  return `${s.targetName} ${kind} 끝${s.unseen ? ', 결과가 와 있어요' : ''}`;
}

// ── 보내두기 목록 ──

/** 보내두기 메뉴: 계정의 캐릭터마다 지금 상태와 할 일 하나. */
export function SendHub() {
  const { characters } = useSession();
  const [sends, reload] = useSends();
  const [conds, setConds] = useState<Condition[]>([]);
  useMinuteTick();
  const loadConds = useCallback(async () => setConds(await api.listConditions()), []);
  useEffect(() => {
    void loadConds();
  }, [loadConds]);
  if (!sends) return <Frame plate="보내두기" ingame><Loading text="보낸 일을 불러오는 중" /></Frame>;

  return (
    <Frame
      plate="보내두기"
      ingame
      header={<ScreenHeader title="보내두기" sub={`캐릭터 ${characters.length}명`} back={{ to: '/home', label: '상황판으로' }} />}
      scrollLabel="캐릭터별 보내두기"
      deskClass="app-desk--narrow"
    >
      <p className="t-reading" style={{ margin: 0, fontSize: 15 }}>
        보내 두면 접속하지 않아도 끝나요. 능력자는 출동한 뒤 쉬어서 오염을 걷어 내요.
      </p>
      <ul className="app-hub">
        {characters.map((c) => {
          const s = latestOf(sends, c.id);
          const cond = conds.find((x) => x.characterId === c.id);
          const step = nextStep(c, s, cond);
          const running = s && isRunning(s);
          return (
            <li key={c.id} className="app-hub__card">
              <div className="app-hub__who">
                <Face p={persona(c)} size={44} />
                <span className="app-hub__text">
                  <b>{c.name}</b>
                  <span className="t-muted" style={{ fontSize: 13 }}>
                    {ROLE_LABEL[c.role]}
                  </span>
                </span>
                {cond && <ConditionStatus c={cond} />}
              </div>
              <p className="t-muted app-hub__line">
                <Px name={running ? 'hourglass' : 'compass'} small />
                {statusLine(s)}
              </p>
              <div className="app-hub__actions">
                <Link className={step.tag === '보내기' && c.role === 'ability' && cond?.level === 'overload' ? 't-btn t-btn--outline' : 't-btn t-btn--solid'} to={step.to}>
                  {step.label}
                </Link>
                {c.role === 'ability' && !running && step.tag !== '휴식' && (
                  <Link className="t-btn t-btn--outline" to={`/rest/${c.id}`}>
                    휴식
                  </Link>
                )}
                {c.role === 'ability' && !running && step.tag === '휴식' && cond?.level !== 'overload' && (
                  <Link className="t-btn t-btn--outline" to={`/send/${c.id}`}>
                    출동
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {api.dev && (
        <DevBox>
          {characters
            .filter((c) => c.role === 'ability')
            .map((c) => (
              <div key={c.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <span style={{ minWidth: 0 }}>{c.name} 오염</span>
                {[0, 75, 100].map((v) => (
                  <button
                    key={v}
                    type="button"
                    className="t-btn t-btn--outline"
                    onClick={() => void api.dev?.setContamination(c.id, v).then(() => Promise.all([loadConds(), reload()]))}
                  >
                    {v}으로
                  </button>
                ))}
              </div>
            ))}
          {!characters.some((c) => c.role === 'ability') && <p className="t-muted" style={{ margin: 0 }}>능력자가 없어 오염 도구가 없어요.</p>}
        </DevBox>
      )}
    </Frame>
  );
}

/** 가짜 서버에서만 보이는 시험 도구. 진짜 게임에는 없다. */
function DevBox({ children }: { children: ReactNode }) {
  return (
    <section aria-labelledby="dev-h" className="app-dev">
      <h2 id="dev-h" className="t-label" style={{ margin: 0 }}>
        테스트 도구 · 진짜 게임에는 없어요
      </h2>
      {children}
    </section>
  );
}

function DiceSetter() {
  const [v, setV] = useState('');
  const [set, setSet] = useState<string | null>(null);
  return (
    // 화면 전체가 폼일 수 있어 폼을 겹치지 않는다 (버튼으로만 정한다).
    <div style={{ display: 'flex', gap: 8, alignItems: 'end', flexWrap: 'wrap' }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flexGrow: 1, minWidth: 140 }}>
        <span className="t-label">다음 주사위 (1~100)</span>
        <input className="t-input" inputMode="numeric" value={v} onChange={(e) => setV(e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="비우면 무작위" />
      </label>
      <button
        className="t-btn t-btn--outline"
        type="button"
        onClick={() => {
          const n = Number(v);
          void api.dev?.setNextRoll(v === '' || Number.isNaN(n) ? null : n).then(() => setSet(v === '' ? '무작위' : String(n)));
        }}
      >
        정하기
      </button>
      {set && (
        <p className="t-field__help" role="status" style={{ margin: 0, flexBasis: '100%' }}>
          다음 판정 한 번: {set}
        </p>
      )}
    </div>
  );
}

// ── 진행 중 ──

/** 보내 둔 일 하나: 남은 시간, 도착한 갈림길, 끝나면 결과로. */
export function RunScreen() {
  const { id } = useParams();
  const { characters } = useSession();
  const nav = useNavigate();
  const toast = useToast();
  const [sends, reload] = useSends();
  const [fork, setFork] = useState<Fork | null | undefined>(undefined);
  const [pick, setPick] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useMinuteTick();

  const loadFork = useCallback(async () => {
    if (id) setFork(await api.getFork(id));
  }, [id]);
  useEffect(() => {
    void loadFork();
  }, [loadFork]);

  const s = sends?.find((x) => x.id === id);
  if (sends && !s) return <Navigate to="/send" replace />;
  if (!s || fork === undefined) return <Frame plate="보내두기" ingame><Loading text="현장 기록을 불러오는 중" /></Frame>;

  const c = characters.find((x) => x.id === s.characterId);
  const kind = SEND_KIND_LABEL[s.kind];
  const running = isRunning(s);
  const dispatch = s.kind === 'dispatch';
  const waiting = fork && !fork.chosen && running;

  async function choose() {
    if (!id || !pick || busy) return;
    setBusy(true);
    const r = await api.chooseFork(id, pick);
    setBusy(false);
    if (!r.ok) {
      toast({ kind: 'danger', text: r.message });
      await Promise.all([loadFork(), reload()]);
      return;
    }
    await Promise.all([loadFork(), reload()]);
  }

  const refresh = () => Promise.all([loadFork(), reload()]).then(() => undefined);

  return (
    <Frame
      plate="보내두기"
      ingame
      header={<ScreenHeader title={`${s.characterName}의 ${kind}`} sub={running ? `${clockKST(s.endsAt)}에 끝나요` : '끝났어요'} back={{ to: '/send', label: '보내두기로' }} right={dispatch ? <GovLine /> : undefined} />}
      onSubmit={waiting ? () => void choose() : undefined}
      bar={
        waiting ? (
          <div className="t-formbar">
            <button className="t-btn t-btn--primary" type="submit" disabled={!pick || busy} aria-busy={busy || undefined}>
              {busy ? '판정하는 중…' : pick ? '이걸로 고르기' : '선택지를 골라 주세요'}
            </button>
          </div>
        ) : !running ? (
          <div className="t-formbar">
            <Link className="t-btn t-btn--primary" to={`/result/${s.id}`}>
              결과 보기
            </Link>
          </div>
        ) : undefined
      }
      scrollLabel={`${kind} 진행`}
      deskClass="app-desk--narrow"
    >
      {dispatch && <GovBand />}
      <section aria-labelledby="run-h" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2 id="run-h" className="t-label" style={{ margin: 0 }}>
          {running ? '진행 중' : '끝남'}
        </h2>
        <div className="app-runbox">
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <b>{s.targetName}</b>
            <span className="t-muted" style={{ fontSize: 14 }}>
              {s.methodLabel} · {s.hours}시간
            </span>
          </span>
          {running ? (
            <span className="t-status t-status--info" style={{ whiteSpace: 'nowrap' }}>
              {remaining(s.endsAt)} 남음
            </span>
          ) : (
            <span className="t-status t-status--ok">끝남</span>
          )}
        </div>
        {running && (
          <p className="t-field__help" style={{ margin: 0 }}>
            {s.kind === 'rest' ? '쉬는 동안 그 장소 채널에 "머무는 중"으로 보여요.' : `${josa(s.targetName, '은/는')} 지금 ${s.characterName}이 머무는 곳이에요. 그곳 채널에 "${kind} 중"으로 보여요.`}
          </p>
        )}
      </section>

      {fork && !fork.chosen && !running && <p className="t-reading">갈림길은 끝날 때까지 고르지 않아 자동으로 처리됐어요. 결과에서 볼 수 있어요.</p>}
      {waiting && fork && (
        <section aria-labelledby="fork-h" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 id="fork-h" className="t-pixel" style={{ margin: 0, fontSize: 17, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Px name="envelope" />
            갈림길이 왔어요
            {fork.gov && <span className="t-tag t-tag--gov">정부</span>}
          </h2>
          <p className="t-reading" style={{ margin: 0 }}>
            {fork.situation}
          </p>
          <MetLine met={fork.met} me={c} />
          <PickGroup
            legend={`${fork.code} ${fork.title}`}
            value={pick}
            onChange={setPick}
            options={fork.options.map((o, i) => ({
              value: o.id,
              title: o.label,
              keyHint: String(i + 1),
              side: (
                <>
                  {o.auto && <span className="t-tag t-pick__auto">자동</span>}
                  {o.stat ? <span className="t-tag t-pick__stat">{`${o.statLabel} ${o.target}`}</span> : <span className="t-tag t-pick__stat t-pick__stat--none">판정 없음</span>}
                </>
              ),
            }))}
            note={`정답은 없어요. ${clockKST(fork.deadline)}까지 고르지 않으면 "자동"이 처리되고, 기록에 남지 않아요.`}
          />
        </section>
      )}
      {fork?.chosen && <ForkDone title={`${fork.code} ${fork.title}`} outcome={fork.chosen} others={fork.options.filter((o) => o.id !== fork.chosen?.optionId).map((o) => o.label)} />}
      {!fork && running && s.kind !== 'rest' && (
        <p className="t-field__help" style={{ margin: 0 }}>
          도중에 갈림길이 오면 알림으로 알려 드려요.
        </p>
      )}

      {api.dev && running && (
        <DevBox>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="t-btn t-btn--outline" type="button" onClick={() => void api.dev?.finishNow(s.id).then(refresh)}>
              바로 끝내기
            </button>
            {s.kind !== 'rest' && !fork && (
              <button
                className="t-btn t-btn--outline"
                type="button"
                onClick={() => void api.dev?.bringFork(s.id).then(refresh)}
              >
                갈림길 오게 하기
              </button>
            )}
          </div>
          <DiceSetter />
        </DevBox>
      )}
      {!running && (
        <button className="t-btn t-btn--ghost" type="button" onClick={() => nav('/send')} style={{ alignSelf: 'flex-start' }}>
          보내두기 목록으로
        </button>
      )}
    </Frame>
  );
}

function MetLine({ met, me }: { met: Persona[]; me: Character | undefined }) {
  const nav = useNavigate();
  const toast = useToast();
  if (!met.length || !me) return null;
  return (
    <ul className="app-met" aria-label="같은 곳에 있던 사람">
      {met.map((p) => (
        <li key={p.id}>
          <Face p={p} size={36} />
          <span style={{ flexGrow: 1, minWidth: 0 }}>{p.name}</span>
          <button
            type="button"
            className="t-btn t-btn--outline"
            onClick={() =>
              void api.openDm(me.id, p.id).then((r) => {
                if (r.ok) nav(`/dm/${r.value}`);
                else toast({ kind: 'danger', text: r.message });
              })
            }
          >
            말 걸기
          </button>
        </li>
      ))}
    </ul>
  );
}

/** 고른 갈림길: 판정 뒤의 고르기 칸 (목록). 고른 칸만 밝고 결과가 붙는다. */
function ForkDone({ title, outcome, others = [] }: { title: string; outcome: ForkOutcome; others?: string[] }) {
  const r = outcome.roll;
  return (
    <section className="t-picks" aria-labelledby="fd-h">
      <p id="fd-h" className="t-picks__legend">
        {title} · {outcome.auto ? '자동 처리' : '고름'}
      </p>
      <ul className="t-picks t-picks--done">
        <li className="t-pick" aria-current="true">
          <span className="t-pick__lamp" aria-hidden="true" />
          <span className="t-pick__title">
            <span className="t-sr">고른 선택: </span>
            {outcome.optionLabel}
          </span>
          {outcome.auto && (
            <span className="t-pick__side">
              <span className="t-tag t-pick__auto">자동</span>
            </span>
          )}
          <div className="t-pick__result">
            {r && (
              <p className="t-pick__check" style={{ margin: 0 }}>
                {r.statLabel} 판정 <b>{`${r.value} / ${r.target}`}</b>
                <span className={isSuccess(r.grade) ? 't-status t-status--ok' : 't-status'}>{GRADE_LABEL[r.grade]}</span>
              </p>
            )}
            <p className="t-pick__outcome">{outcome.text}</p>
            {outcome.record && <p className="t-pick__record">판독지 선택 기록에 남았어요: 「{outcome.record}」</p>}
            {outcome.paper && (
              <p className="t-pick__record">
                {outcome.paper.from === 'gov' ? '정부 공문' : '재단 메모'} "{outcome.paper.text}" 한 장이 판독지에 남았어요.
              </p>
            )}
            {outcome.auto && <p className="t-pick__record">자동 처리는 판정하지 않고, 기록에 남지 않아요.</p>}
          </div>
        </li>
        {others.map((o) => (
          <li className="t-pick" key={o}>
            <span className="t-pick__lamp" aria-hidden="true" />
            <span className="t-pick__title">{o}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── 결과 ──

/** M-15 보내두기 결과: 판정 굴림 → 결과 문구 → 얻은 것 → 다음에 할 수 있는 일. */
export function ResultScreen() {
  const { id } = useParams();
  const { characters } = useSession();
  const toast = useToast();
  const [r, setR] = useState<SendResult | null | undefined>(undefined);
  const [pending, setPending] = useState(false);
  const [cond, setCond] = useState<Condition | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    void api.getSendResult(id).then((res) => {
      if (res.ok) setR(res.value);
      else if (res.message.startsWith('아직')) setPending(true);
      else setR(null);
    });
  }, [id]);
  useEffect(() => {
    if (r) void api.getCondition(r.characterId).then(setCond);
  }, [r]);

  if (pending) return <Navigate to={`/run/${id}`} replace />;
  if (r === null) return <Navigate to="/send" replace />;
  if (!r) return <Frame plate="보내두기" ingame><Loading text="판정 기록을 불러오는 중" /></Frame>;

  const c = characters.find((x) => x.id === r.characterId);
  const kind = SEND_KIND_LABEL[r.kind];
  const dispatch = r.kind === 'dispatch';
  const rest = r.kind === 'rest';
  const after = r.contamination?.after ?? 0;
  const next =
    r.role === 'ability' && !rest && after > 0
      ? { to: `/rest/${r.characterId}`, label: '휴식하러 가기' }
      : { to: `/send/${r.characterId}`, label: rest ? '출동 보내기' : `다시 ${kind} 보내기` };

  async function push() {
    if (!id || busy) return;
    setBusy(true);
    const res = await api.pushSend(id);
    setBusy(false);
    if (!res.ok) return toast({ kind: 'danger', text: res.message });
    setR(res.value);
    if (res.value.contamination) setCond(await api.getCondition(res.value.characterId));
  }

  const lastLine = r.met.length
    ? `${josa(`${r.met[0]?.name ?? ''}${r.met.length > 1 ? ` 외 ${r.met.length - 1}명` : ''}`, '와/과')} 같은 곳에 있었어요. 말을 걸어 보세요.`
    : r.contamination
      ? `오염 ${after}.`
      : `얻은 물품 ${r.items.reduce((a, b) => a + b.count, 0)}개.`;

  return (
    <Frame
      plate="보내두기"
      ingame
      header={<ScreenHeader title={`${r.characterName}의 ${kind} 결과`} sub={`${r.targetName} · ${r.hours}시간`} back={{ to: '/send', label: '보내두기로' }} right={dispatch ? <GovLine /> : undefined} />}
      bar={
        <div className="t-formbar">
          <Link className="t-btn t-btn--outline" to="/home">
            상황판
          </Link>
          <Link className="t-btn t-btn--primary" to={next.to}>
            {next.label}
          </Link>
        </div>
      }
      scrollLabel={`${kind} 결과`}
      deskClass="app-desk--narrow"
    >
      {dispatch && <GovBand />}
      {r.roll && <RollReadout roll={r.roll} quip={r.quip} replayKey={`${r.roll.value}-${r.firstRoll ? 'p' : 'f'}`} />}
      {r.firstRoll && (
        <p className="t-field__help" style={{ margin: 0 }}>
          처음 굴림 {r.firstRoll.value} / {r.firstRoll.target} {GRADE_LABEL[r.firstRoll.grade]} → 밀어붙여 한 번 더 굴렸어요.
        </p>
      )}

      <section aria-labelledby="res-h" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2 id="res-h" className="t-label" style={{ margin: 0, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {r.methodLabel}
          {r.outcome && <span className={r.outcome === '순조' ? 't-status t-status--ok' : 't-status t-status--warn'}>{r.outcome}</span>}
        </h2>
        {r.lines.map((l, i) => (
          <p key={i} className="t-reading" style={{ margin: 0 }}>
            {l}
          </p>
        ))}
      </section>

      {r.push && (
        <section aria-labelledby="push-h" className="app-push">
          <h2 id="push-h" className="t-label" style={{ margin: 0 }}>
            밀어붙이기
          </h2>
          <p className="t-reading" style={{ margin: 0, fontSize: 15 }}>
            실패한 판정을 한 번 더 굴려요. 다시 실패해도 지금 결과보다 나빠지지 않아요. 대가: {r.push.cost}.
          </p>
          <button className="t-btn t-btn--outline" type="button" onClick={() => void push()} aria-busy={busy || undefined} disabled={busy}>
            {busy ? '굴리는 중…' : '한 번 더 굴리기'}
          </button>
        </section>
      )}

      {(r.gains.length > 0 || r.items.length > 0 || r.growth) && (
        <section aria-labelledby="gain-h" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h2 id="gain-h" className="t-label" style={{ margin: 0 }}>
            얻은 것
          </h2>
          <div className="t-cells">
            {r.gains.map((g) => (
              <div className="t-cell" key={g.label}>
                <span className="t-cell__k">{g.label}</span>
                <span className="t-cell__v">{g.value}</span>
              </div>
            ))}
            {r.items.map((it) => (
              <div className="t-cell" key={it.name}>
                <span className="t-cell__k">물품</span>
                <span className="t-cell__v">
                  {it.name} ×{it.count}
                </span>
              </div>
            ))}
            {r.growth && (
              <div className="t-cell">
                <span className="t-cell__k">성장 표시</span>
                <span className="t-cell__v">{r.growth.label}</span>
              </div>
            )}
          </div>
          {r.growth && (
            <p className="t-field__help" style={{ margin: 0 }}>
              성장 표시가 붙은 능력치는 새벽에 한 번 오를 기회가 있어요. 결과는 "오늘 한눈에"에서 알려 드려요.
            </p>
          )}
        </section>
      )}

      {r.contamination && cond && <ContaminationGauge c={{ ...cond, contamination: r.contamination.before }} preview={r.contamination.after} label="오염 (출발 전 → 지금)" />}

      {r.fork && <ForkDone title={r.fork.title} outcome={r.fork} />}

      <section aria-labelledby="next-h" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2 id="next-h" className="t-label" style={{ margin: 0 }}>
          다음
        </h2>
        <p className="t-reading" style={{ margin: 0 }}>
          {lastLine}
        </p>
        <MetLine met={r.met} me={c} />
      </section>
    </Frame>
  );
}

// ── 휴식 ──

export function RestIndex() {
  const { characters } = useSession();
  const first = characters.find((c) => c.role === 'ability');
  return <Navigate to={first ? `/rest/${first.id}` : '/send'} replace />;
}

/** 휴식 고르기 (능력자): 종류와 시간, 줄어들 오염을 미리 보여 준다. */
export function RestScreen() {
  const { id } = useParams();
  const { characters } = useSession();
  const nav = useNavigate();
  const toast = useToast();
  const [opts, setOpts] = useState<RestOptions | null>(null);
  const [cond, setCond] = useState<Condition | null>(null);
  const [kind, setKind] = useState<RestKind | null>(null);
  const [hours, setHours] = useState('4');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    void Promise.all([api.getRestOptions(id), api.getCondition(id)]).then(([o, c]) => {
      setOpts(o);
      setCond(c);
      setKind(c?.level === 'overload' ? 'treat' : 'alone');
    });
  }, [id]);

  const c = characters.find((x) => x.id === id);
  if (!c) return <Navigate to="/send" replace />;
  if (!opts || !cond) return <Frame plate="휴식" ingame><Loading text="쉴 곳을 불러오는 중" /></Frame>;

  const h = Number(hours);
  const chosen = opts.options.find((o) => o.id === kind);
  const now = cond.contamination ?? 0;
  const after = chosen ? Math.max(0, now - (chosen.estimate[h] ?? 0)) : now;

  async function submit() {
    if (!id || !kind || busy || opts?.blocked) return;
    setBusy(true);
    const r = await api.startRest({ characterId: id, kind, hours: h });
    setBusy(false);
    if (!r.ok) return toast({ kind: 'danger', text: r.message });
    // 진행 화면이 곧 확인이다 (언제 끝나는지, 어디에 머무는지).
    nav(`/run/${r.value.id}`);
  }

  return (
    <Frame
      plate="휴식"
      ingame
      header={<ScreenHeader title={`${c.name}의 휴식`} sub="오염 걷어 내기" back={{ to: '/send', label: '보내두기로' }} />}
      onSubmit={() => void submit()}
      bar={
        <div className="t-formbar">
          <button className="t-btn t-btn--primary" type="submit" disabled={!kind || busy || !!opts.blocked} aria-busy={busy || undefined}>
            {busy ? '쉬러 가는 중…' : `${h}시간 쉬기`}
          </button>
        </div>
      }
      scrollLabel="휴식 고르기"
      deskClass="app-desk--narrow"
      keys={[['[↑/↓]', '고르기'], ['[Enter]', '쉬기']]}
    >
      <ContaminationGauge c={cond} preview={opts.blocked ? undefined : after} />
      {opts.blocked ? (
        <div className="t-toast" role="status" style={{ animation: 'none' }}>
          <span className="t-toast__text">{opts.blocked}</span>
        </div>
      ) : (
        <p className="t-reading" style={{ margin: 0, fontSize: 15 }}>
          휴식에는 실패가 없어요. 어떤 휴식이든 끝나면 오염이 줄어요.
        </p>
      )}
      <PickGroup<RestKind>
        legend="어떻게 쉴까요"
        value={kind}
        onChange={setKind}
        options={opts.options.map((o) => ({
          value: o.id,
          title: o.label,
          desc: (
            <>
              {o.place}. {o.desc}
            </>
          ),
          side: (
            <>
              {o.request && <span className="t-tag">요청</span>}
              <span className="t-tag t-pick__stat">오염 -{o.estimate[h]}</span>
            </>
          ),
          disabled: !!o.disabled,
        }))}
        note={chosen?.request ? '요청은 재단 직원이 접속했을 때 받아요. 받지 않아도 혼자 쉬기만큼은 줄어요.' : undefined}
      />
      <PickGroup legend="시간" row value={hours} onChange={setHours} options={opts.hours.map((x) => ({ value: String(x), title: `${x}시간` }))} />
    </Frame>
  );
}
