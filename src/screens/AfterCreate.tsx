import { useEffect, useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { TEXT_LIMITS } from '../config/balance';
import { detectPlatform, isStandalone, useIsDesktop, type Platform } from '../lib/useIsDesktop';
import { clockKST, remaining } from '../lib/time';
import { josa } from '../lib/josa';
import { api } from '../services';
import { Frame, FormBar, ScreenHeader } from '../shell/Frame';
import { TextField } from '../ui/Field';
import { Loading } from '../ui/Loading';
import { PickGroup, StatTag } from '../ui/Pick';
import { Px } from '../ui/Px';
import { useToast } from '../ui/Toast';
import { SEND_KIND_LABEL, statLabel, type ActiveSend, type Character, type Condition, type Place, type QnaPrompt, type SendOptions } from '../types/domain';
import { ContaminationGauge } from '../ui/Gauge';
import { GuardSwitch } from '../ui/Switch';
import { Record } from './create/Record';

function useCharacter(id: string | undefined) {
  const [c, setC] = useState<Character | null | undefined>(undefined);
  useEffect(() => {
    if (id) void api.getCharacter(id).then(setC);
  }, [id]);
  return c;
}

/** 처음 안내를 이어 갈 다음 화면: 홈 화면에서 연 사람은 안내를 건너뛴다. */
function afterRegistered(id: string) {
  return isStandalone() ? `/send/${id}?first=1` : `/install?c=${id}`;
}

/** M-08 등록 끝 · 첫 문답 */
export function RegisteredScreen() {
  const { id } = useParams();
  const c = useCharacter(id);
  const nav = useNavigate();
  const toast = useToast();
  const [prompt, setPrompt] = useState<QnaPrompt | null>(null);
  const [answer, setAnswer] = useState('');
  const [answered, setAnswered] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void api.getQnaPrompt('created').then(setPrompt);
  }, []);
  if (c === null) return <Navigate to="/home" replace />;
  if (!c || !id) return <Frame plate="캐릭터 등록"><Loading /></Frame>;

  async function save() {
    if (!prompt || !id || !answer.trim()) return;
    const r = await api.answerQna(id, prompt.id, answer.trim());
    if (!r.ok) return setErr(r.message);
    setErr(null);
    setAnswered(true);
    toast({ kind: 'ok', text: `${c?.name}의 답을 판독지 문답 칸에 남겼어요.` });
  }

  return (
    <Frame
      plate="캐릭터 등록"
      onSubmit={() => nav(afterRegistered(id))}
      bar={<FormBar next="다음: 홈 화면에 두기" />}
      scrollLabel="등록 끝"
      deskClass="app-desk--narrow"
    >
      <div role="status">
        <h1 className="t-pixel t-glow" style={{ margin: 0, fontSize: 18 }}>
          {c.name}의 기록이 만들어졌어요
        </h1>
      </div>
      <Record
        data={{ role: c.role, name: c.name, memoryLoss: c.memoryLoss, preRecord: c.preRecord ?? {}, origin: c.originSettlement?.name ?? null, stats: c.stats, past: c.past, registrationNo: c.registrationNo }}
        stamped
      />
      {prompt && (
        <section aria-labelledby="qa-h" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, border: '1px solid var(--line-strong)' }}>
          <h2 id="qa-h" className="t-label" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Px name="clipboard" small />
            문답 · 등록한 날
          </h2>
          {answered ? (
            <p className="t-reading" style={{ margin: 0 }}>
              남겼어요. 판독지 문답 칸에서 볼 수 있어요.
            </p>
          ) : (
            <>
              <TextField
                label={prompt.text}
                value={answer}
                onChange={setAnswer}
                max={TEXT_LIMITS.qnaAnswer}
                placeholder={`${c.name}의 말로 한 줄`}
                help="답하지 않아도 돼요. 답은 판독지 문답 칸에 남아요."
                error={err}
              />
              <div>
                <button className="t-btn t-btn--outline" type="button" disabled={!answer.trim()} onClick={() => void save()}>
                  답 남기기
                </button>
              </div>
            </>
          )}
        </section>
      )}
    </Frame>
  );
}

const HOWTO: Record<Platform, { tab: string; steps: ReactNode[] }> = {
  ios: {
    tab: '아이폰',
    steps: [
      <>사파리 아래쪽의 <b>공유</b> 버튼을 눌러요.</>,
      <>목록을 내려 <b>홈 화면에 추가</b>를 골라요.</>,
      <>오른쪽 위 <b>추가</b>를 눌러요.</>,
      <>이제부터 홈 화면의 아이콘으로 열어요. 알림은 이 아이콘으로 연 단말에만 와요.</>,
    ],
  },
  android: {
    tab: '안드로이드',
    steps: [
      <>크롬 오른쪽 위의 <b>메뉴(점 세 개)</b>를 눌러요.</>,
      <><b>홈 화면에 추가</b>나 <b>앱 설치</b>를 골라요.</>,
      <>확인 창에서 <b>추가</b>를 눌러요.</>,
    ],
  },
  pc: {
    tab: 'PC',
    steps: [
      <>크롬이나 엣지 주소창 오른쪽의 <b>설치</b> 아이콘을 눌러요.</>,
      <>확인 창에서 <b>설치</b>를 눌러요. 창 하나로 따로 열려요.</>,
    ],
  },
};

/** M-09 홈 화면에 두기 (건너뛸 수 있다) */
export function InstallScreen() {
  const [sp] = useSearchParams();
  const id = sp.get('c') ?? '';
  const nav = useNavigate();
  const [tab, setTab] = useState<Platform>(detectPlatform());
  const next = `/send/${id}?first=1`;
  const tabs: Platform[] = ['ios', 'android', 'pc'];
  return (
    <Frame
      plate="안내"
      header={<ScreenHeader title="홈 화면에 두기" sub="처음 안내 1 / 3" back={{ to: `/registered/${id}`, label: '이전 화면으로' }} />}
      onSubmit={() => nav(next)}
      bar={<FormBar prev="건너뛰기" onPrev={() => nav(next)} next="다 했어요" />}
      scrollLabel="홈 화면에 두는 법"
      deskClass="app-desk--narrow"
    >
      <p className="t-reading" style={{ margin: 0 }}>
        홈 화면에 두면 보내두기가 끝났을 때 알림을 받을 수 있어요.
      </p>
      <p className="t-field__help" style={{ margin: 0 }}>
        아이폰은 홈 화면에 둔 경우에만 알림이 와요. 알림 없이도 다시 접속하면 "오늘 한눈에"에서 모든 결과를 볼 수 있어요.
      </p>
      <div role="tablist" aria-label="기기" style={{ display: 'flex', gap: 6 }}>
        {tabs.map((t) => (
          <button
            key={t}
            className="t-tab"
            style={{ flex: 1 }}
            role="tab"
            type="button"
            id={`hw-${t}`}
            aria-controls="hw-panel"
            aria-selected={tab === t}
            tabIndex={tab === t ? 0 : -1}
            onClick={() => setTab(t)}
            onKeyDown={(e) => {
              const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
              if (!d) return;
              const n = tabs.at((tabs.indexOf(t) + d + tabs.length) % tabs.length) ?? t;
              setTab(n);
              document.getElementById(`hw-${n}`)?.focus();
            }}
          >
            {HOWTO[t].tab}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="hw-panel" aria-labelledby={`hw-${tab}`}>
        <ol className="t-howto">
          {HOWTO[tab].steps.map((s, i) => (
            <li key={i}>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </div>
    </Frame>
  );
}

/** M-13 · M-21 보내두기 (출동, 근무, 다녀오기 공통의 가벼운 판). 정부 작전판 연출은 다음 묶음에서 입힌다. */
export function SendScreen() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const first = sp.get('first') === '1';
  const c = useCharacter(id);
  const nav = useNavigate();
  const toast = useToast();
  const desktop = useIsDesktop();
  const [opts, setOpts] = useState<SendOptions | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const [method, setMethod] = useState<string | null>(null);
  const [hours, setHours] = useState<string>('4');
  const [boost, setBoost] = useState(false);
  const [cond, setCond] = useState<Condition | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    void api.getSendOptions(id).then((o) => {
      setOpts(o);
      setTarget(o.targets[0]?.id ?? null);
    });
    void api.getCondition(id).then(setCond);
  }, [id]);
  if (c === null) return <Navigate to="/home" replace />;
  if (!c || !opts || !id) return <Frame plate="보내두기" ingame={!first}><Loading text="보낼 곳을 불러오는 중" /></Frame>;

  const kind = SEND_KIND_LABEL[opts.kind];
  const ready = target && method && hours && !opts.blocked;
  const dispatch = opts.kind === 'dispatch';

  async function submit() {
    if (!ready || busy || !id || !target || !method) return;
    setBusy(true);
    const r = await api.startSend({ characterId: id, targetId: target, methodId: method, hours: Number(hours), boost: dispatch && boost });
    setBusy(false);
    if (!r.ok) return toast({ kind: 'danger', text: r.message });
    if (first) return nav(`/sent/${r.value.id}?first=1`, { replace: true });
    // 진행 화면이 곧 확인이다 (언제 끝나는지, 어디에 머무는지).
    nav(`/run/${r.value.id}`);
  }

  return (
    <Frame
      plate="보내두기"
      ingame={!first}
      header={
        <ScreenHeader
          title={`${c.name}의 ${kind}`}
          sub={first ? '처음 안내 2 / 3' : '보내두기'}
          back={{ to: first ? '/home' : '/send', label: first ? '상황판으로' : '보내두기로' }}
          right={dispatch ? <span className="t-tag t-tag--gov" style={{ whiteSpace: 'nowrap' }}>정부 회선</span> : undefined}
        />
      }
      onSubmit={() => void submit()}
      bar={<FormBar next={busy ? '보내는 중…' : `${hours}시간 ${kind} 보내기`} nextDisabled={!ready} busy={busy} />}
      scrollLabel={`${kind} 고르기`}
      deskClass="app-desk--narrow"
      keys={[['[↑/↓]', '고르기'], ['[Enter]', '보내기']]}
    >
      {dispatch && <div className="t-hazard t-hazard--thin" aria-hidden="true" style={{ margin: '-16px -14px 0' }} />}
      {first && (
        <p className="t-reading" style={{ margin: 0, fontSize: 15 }}>
          보내 두면 접속하지 않아도 시간이 흘러 끝나요. 끝나면 결과와 함께 말 걸 사람이 생겨요.
        </p>
      )}
      {cond && cond.contamination !== null && <ContaminationGauge c={cond} />}
      {opts.blocked && (
        <div className="t-toast" role="status" style={{ animation: 'none', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
          <span className="t-toast__text">{opts.blocked}</span>
          {cond?.level === 'overload' && (
            <Link className="t-btn t-btn--outline" to={`/rest/${c.id}`}>
              휴식하러 가기
            </Link>
          )}
        </div>
      )}
      <PickGroup
        legend={opts.targetLegend}
        row
        value={target}
        onChange={setTarget}
        options={opts.targets.map((t) => ({ value: t.id, title: t.name, side: t.note ? <span className="t-tag t-pick__stat">{t.note}</span> : undefined }))}
      />
      <PickGroup
        legend="방식 · 고른 능력치로 판정해요"
        row
        value={method}
        onChange={setMethod}
        options={opts.methods.map((m, i) => ({
          value: m.id,
          title: m.label,
          keyHint: desktop ? String(i + 1) : undefined,
          side: <StatTag label={statLabel(boost && dispatch ? 'craft' : m.stat, c.role)} value={Math.max(1, c.stats[boost && dispatch ? 'craft' : m.stat] - opts.penalty)} />,
        }))}
        note={opts.penalty ? `오염이 높아 판정 수치가 ${opts.penalty} 내려가 있어요. 꼬리표는 내려간 값이에요.` : undefined}
      />
      {opts.boost && (
        <GuardSwitch
          label="능력을 아끼지 않는다"
          checked={boost}
          onChange={setBoost}
          risk="오염이 더 쌓이는 선택"
          note={`${boost ? '' : '켜면 '}능력으로 판정해요. 성공하면 기여가 크게 오르고, 오염은 ${opts.boost.extraContamination} 더 쌓여요.`}
        />
      )}
      <PickGroup
        legend="시간"
        row
        value={hours}
        onChange={setHours}
        options={opts.hours.map((h) => ({ value: String(h), title: `${h}시간` }))}
        note="시간이 길수록 얻는 것이 많아요. 도중에 갈림길이 올 수 있어요."
      />
    </Frame>
  );
}

/** M-10 첫 보내두기 뒤 · 알림 묻기 */
export function SentScreen() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const first = sp.get('first') === '1';
  const toast = useToast();
  const [send, setSend] = useState<ActiveSend | null | undefined>(undefined);
  const [place, setPlace] = useState<Place | null>(null);
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>(() => ('Notification' in window ? Notification.permission : 'unsupported'));
  const [asked, setAsked] = useState(false);

  useEffect(() => {
    if (id) void api.getSend(id).then(setSend);
    void api.getBusiestPlace().then(setPlace);
  }, [id]);
  if (send === null) return <Navigate to="/home" replace />;
  if (!send) return <Frame plate="보내두기"><Loading /></Frame>;

  const kind = SEND_KIND_LABEL[send.kind];
  // 아이폰은 홈 화면에 둔 웹앱에서만 알림을 받을 수 있다.
  const iosNotInstalled = detectPlatform() === 'ios' && !isStandalone();

  async function enable() {
    const p = await Notification.requestPermission();
    setPerm(p);
    setAsked(true);
    if (p === 'granted') {
      // TODO: 서비스 워커의 pushManager.subscribe(VAPID 공개 키)로 구독을 만들어 넘긴다 (Supabase 연결 단계).
      await api.savePushSubscription(null);
      toast({ kind: 'ok', text: '알림을 켰어요. 끝나면 이 기기로 알려 드려요.' });
    }
  }

  const showAsk = first && !asked && perm === 'default';
  return (
    <Frame
      plate="보내두기"
      ingame={!first}
      header={<ScreenHeader title={`${josa(kind, '을/를')} 보냈어요`} sub={first ? '처음 안내 2 / 3' : '보내두기'} back={{ to: '/home', label: '상황판으로' }} />}
      bar={
        <div className="t-formbar">
          <Link className="t-btn t-btn--primary" to={`/place/${place?.id ?? 'lounge'}`}>
            {place ? `${josa(place.name, '으로/로')} 가기` : '장소 채널로 가기'}
          </Link>
        </div>
      }
      scrollLabel="보낸 뒤"
      deskClass="app-desk--narrow"
    >
      <div className="t-toast t-toast--ok" role="status" style={{ animation: 'none' }}>
        <span className="t-toast__text">
          {send.characterName}의 {josa(`${send.hours}시간 ${kind}`, '을/를')} 보냈어요. {clockKST(send.endsAt)}에 돌아와요.
        </span>
      </div>
      <section aria-labelledby="run-h" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h2 id="run-h" className="t-label">
          진행 중
        </h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '10px 12px', border: '1px solid var(--line-strong)' }}>
          <span>
            {send.targetName} · {send.methodLabel}
          </span>
          <span className="t-pixel" style={{ whiteSpace: 'nowrap' }}>
            {remaining(send.endsAt)} 남음
          </span>
        </div>
      </section>
      {showAsk && (
        <section aria-labelledby="ask-h" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14, border: '2px solid var(--accent)', background: 'var(--surface-raised)' }}>
          <h2 id="ask-h" className="t-pixel" style={{ margin: 0, fontSize: 17, display: 'flex', gap: 8, alignItems: 'center' }}>
            <Px name="envelope" />
            끝나면 알려 드릴까요?
          </h2>
          <p className="t-reading" style={{ margin: 0, fontSize: 15 }}>
            {send.characterName}의 {josa(kind, '이/가')} 끝나면 이 기기로 알림을 보내요.
          </p>
          <p className="t-field__help" style={{ margin: 0 }}>
            밤 11시부터 아침 8시까지는 보내지 않고, 아침에 한 번에 묶어 보내요. 종류별로 단말 설정에서 끌 수 있어요.
          </p>
          {iosNotInstalled ? (
            <Link className="t-btn t-btn--outline" to={`/install?c=${send.characterId}`}>
              아이폰은 홈 화면에 두어야 알림이 와요
            </Link>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="t-btn t-btn--solid" type="button" style={{ flexGrow: 1 }} onClick={() => void enable()}>
                알림 받기
              </button>
              <button className="t-btn t-btn--outline" type="button" onClick={() => setAsked(true)}>
                나중에
              </button>
            </div>
          )}
        </section>
      )}
      {asked && perm === 'denied' && (
        <p className="t-field__help" style={{ margin: 0 }}>
          알림 없이도 다시 접속하면 "오늘 한눈에"에서 모두 볼 수 있어요.
        </p>
      )}
      {place && (
        <section aria-labelledby="nx-h" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
          <h2 id="nx-h" className="t-label">
            기다리는 동안
          </h2>
          <p className="t-reading" style={{ margin: 0, fontSize: 15 }}>
            {place.name}에 {place.staying}명이 머무는 중이에요. 들러서 인사해 보세요.
          </p>
        </section>
      )}
    </Frame>
  );
}
