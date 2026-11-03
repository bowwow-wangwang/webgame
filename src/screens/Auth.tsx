import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { TEXT_LIMITS } from '../config/balance';
import { GAME_TITLE } from '../config/game';
import { useIsDesktop } from '../lib/useIsDesktop';
import { useSession } from '../lib/session';
import { api } from '../services';
import { Frame, FormBar, ScreenHeader } from '../shell/Frame';
import { Agree } from '../ui/Agree';
import { TextField } from '../ui/Field';
import { Vital } from '../ui/Vital';
import { Sheet } from '../ui/Sheet';
import { useToast } from '../ui/Toast';
import zoneImg from '../assets/sample/zone-evron-wide.webp';

export type LegalKind = 'terms' | 'privacy' | 'rules';
export const LEGAL_TITLE: Record<LegalKind, string> = { terms: '이용약관', privacy: '개인정보 처리방침', rules: '이용 규칙' };

/** 약관 읽기: 새 창이 아니라 같은 화면 위에 열리고, 닫으면 쓰던 칸이 그대로다. 글은 운영자가 채운다. */
export function LegalSheet({ kind, onClose }: { kind: LegalKind; onClose: () => void }) {
  return (
    <Sheet title={LEGAL_TITLE[kind]} onClose={onClose} labelId="legal-t">
      <p className="t-reading" style={{ margin: 0 }}>
        [{LEGAL_TITLE[kind]} 본문. 운영자가 채운다.]
      </p>
      <div className="t-dialog__actions" style={{ gridTemplateColumns: '1fr' }}>
        <button className="t-btn t-btn--solid" type="button" onClick={onClose}>
          닫기
        </button>
      </div>
    </Sheet>
  );
}

function LegalLinks({ onOpen }: { onOpen: (k: LegalKind) => void }) {
  return (
    <nav aria-label="약관과 규칙" className="app-legal">
      {(Object.keys(LEGAL_TITLE) as LegalKind[]).map((k) => (
        <button key={k} type="button" className="t-btn t-btn--ghost" onClick={() => onOpen(k)}>
          {LEGAL_TITLE[k]}
        </button>
      ))}
    </nav>
  );
}

function Intro({ onLegal }: { onLegal: (k: LegalKind) => void }) {
  return (
    <section className="app-intro" aria-labelledby="intro-title">
      <span className="t-label">생체 반응 감시 단말 · 접속 대기</span>
      <h1 id="intro-title" className="t-pixel t-glow app-intro__title">
        {GAME_TITLE}
      </h1>
      <p className="t-reading">
        휴전 5년차. 백신을 맞은 사람들 가운데 극소수에게 이능력이 나타났고, 그때 기억을 잃었어요. 정부는 그들을 관리대상자로 등록하고, 아킬레아 재단은 그들의 생활을 돌봐요.
      </p>
      <p className="t-reading">당신의 캐릭터를 데려와 그 사이에서 하루를 보내세요. 접속하지 않아도 세계의 시간은 흘러요.</p>
      <Vital />
      <figure className="t-intel" style={{ margin: 'auto 0 0', maxWidth: 640 }}>
        <div className="t-intel__bar" aria-hidden="true" />
        <img src={zoneImg} alt="정찰 사진: 흐린 하늘 아래 겹겹이 친 가시철조망" />
        <figcaption className="t-intel__cap">에브론 경계지대. 정화 작업이 이어지는 곳.</figcaption>
      </figure>
      <LegalLinks onOpen={onLegal} />
    </section>
  );
}

function AuthTabs({ current }: { current: 'login' | 'join' }) {
  // 두 화면을 오가는 링크라서 탭 역할이 아니라 현재 위치 표시(aria-current)를 쓴다.
  return (
    <nav aria-label="접속 방법" style={{ display: 'flex', gap: 6 }}>
      <Link className="t-tab" to="/login" aria-current={current === 'login' ? 'page' : undefined} style={{ flex: 1 }}>
        접속
      </Link>
      <Link className="t-tab" to="/join" aria-current={current === 'join' ? 'page' : undefined} style={{ flex: 1 }}>
        초대 코드로 가입
      </Link>
    </nav>
  );
}

/** M-01 · P-01 로그인 */
export function LoginScreen() {
  const desktop = useIsDesktop();
  const nav = useNavigate();
  const { refresh } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [legal, setLegal] = useState<LegalKind | null>(null);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const r = await api.signIn(email, password);
    setBusy(false);
    if (!r.ok) return setError(r.message);
    await refresh();
    nav('/', { replace: true });
  }

  const form = (
    <>
      <TextField label="이메일" type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={setEmail} />
      <TextField label="비밀번호" type="password" autoComplete="current-password" value={password} onChange={setPassword} error={error} />
      <button className="t-btn t-btn--primary" type="submit" aria-busy={busy || undefined}>
        {busy ? '접속 중…' : '접속하기'}
      </button>
      {/* TODO: 비밀번호 찾기 화면은 인증 메일 발송 설정과 함께 만든다. */}
      <button className="t-btn t-btn--ghost" type="button" style={{ alignSelf: 'flex-start' }} disabled>
        비밀번호를 잊었어요 (준비 중)
      </button>
    </>
  );

  return (
    <>
      <Frame
        plate="접속"
        deskClass="app-desk--auth"
        left={desktop ? <Intro onLegal={setLegal} /> : undefined}
        onSubmit={submit}
        scrollLabel="로그인"
        keys={[['[Tab]', '다음 칸'], ['[Enter]', '접속하기']]}
      >
        {desktop ? (
          <AuthTabs current="login" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="t-label">생체 반응 감시 단말 · 접속 대기</span>
            <h1 className="t-pixel t-glow" style={{ margin: 0, fontSize: 26 }}>
              {GAME_TITLE}
            </h1>
            <p className="t-reading" style={{ margin: 0, fontSize: 15 }}>
              휴전 5년차. 단말에 접속하면 오늘의 기록이 이어져요.
            </p>
          </div>
        )}
        {!desktop && <Vital />}
        {form}
        <section aria-labelledby="new-h" style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
          <h2 id="new-h" className="t-label">
            처음 왔어요
          </h2>
          <Link className="t-btn t-btn--outline" to="/join">
            초대 코드로 가입하기
          </Link>
          <p className="t-field__help">가입은 초대 코드가 있어야 할 수 있어요. 코드는 이미 노는 사람에게 받아요.</p>
        </section>
        {!desktop && <LegalLinks onOpen={setLegal} />}
      </Frame>
      {legal && <LegalSheet kind={legal} onClose={() => setLegal(null)} />}
    </>
  );
}

const REQUIRED = ['age', 'terms', 'privacy', 'rules'] as const;
type Req = (typeof REQUIRED)[number];

/** M-02 · P-01 초대 코드로 가입 */
export function JoinScreen() {
  const desktop = useIsDesktop();
  const nav = useNavigate();
  const toast = useToast();
  const { refresh } = useSession();
  const [code, setCode] = useState('');
  const [codeOk, setCodeOk] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [checks, setChecks] = useState<Record<Req, boolean>>({ age: false, terms: false, privacy: false, rules: false });
  const [errors, setErrors] = useState<Partial<Record<'code' | 'email' | 'password', string>>>({});
  const [busy, setBusy] = useState(false);
  const [legal, setLegal] = useState<LegalKind | null>(null);

  const allChecked = REQUIRED.every((k) => checks[k]);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const pwLen = [...password].length;
  const ready = codeOk === true && emailOk && pwLen >= TEXT_LIMITS.passwordMin && allChecked;

  async function verifyCode() {
    if (!code.trim()) return setCodeOk(null);
    const ok = await api.checkInviteCode(code);
    setCodeOk(ok);
    setErrors((e) => ({ ...e, code: ok ? undefined : '쓸 수 없는 코드예요. 받은 코드를 다시 확인해 주세요.' }));
  }

  async function submit() {
    if (!ready || busy) return;
    setBusy(true);
    const r = await api.signUp({ inviteCode: code, email, password });
    setBusy(false);
    if (!r.ok) {
      if (r.field === 'code' || r.field === 'email' || r.field === 'password') setErrors((e) => ({ ...e, [r.field as string]: r.message }));
      else toast({ kind: 'danger', text: r.message });
      return;
    }
    await refresh();
    nav('/create/1', { replace: true });
  }

  const pwError =
    errors.password ?? (password && pwLen < TEXT_LIMITS.passwordMin ? `${TEXT_LIMITS.passwordMin}자 이상 적어 주세요. 지금 ${pwLen}자예요.` : null);

  return (
    <>
      <Frame
        plate="가입"
        deskClass="app-desk--auth"
        left={desktop ? <Intro onLegal={setLegal} /> : undefined}
        header={desktop ? undefined : <ScreenHeader title="초대 코드로 가입" sub="가입" back={{ to: '/login', label: '로그인으로 돌아가기' }} />}
        onSubmit={submit}
        bar={<FormBar next={busy ? '가입하는 중…' : '가입하기'} nextDisabled={!ready} busy={busy} />}
        scrollLabel="가입"
        keys={[['[Tab]', '다음 칸'], ['[Space]', '체크'], ['[Enter]', '가입하기']]}
      >
        {desktop && <AuthTabs current="join" />}
        <TextField
          label="초대 코드"
          autoComplete="off"
          value={code}
          onChange={(v) => {
            setCode(v);
            setCodeOk(null);
          }}
          onBlur={verifyCode}
          error={codeOk === false ? errors.code : null}
          ok={codeOk ? '쓸 수 있는 코드예요.' : null}
        />
        <TextField
          label="이메일"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={email}
          onChange={(v) => {
            setEmail(v);
            setErrors((e) => ({ ...e, email: undefined }));
          }}
          error={errors.email}
          help="로그인과 비밀번호 찾기에만 써요. 다른 사람에게는 보이지 않아요."
        />
        <TextField
          label="비밀번호"
          type={showPw ? 'text' : 'password'}
          autoComplete="new-password"
          value={password}
          onChange={(v) => {
            setPassword(v);
            setErrors((e) => ({ ...e, password: undefined }));
          }}
          error={pwError}
          trailing={
            <button className="t-btn t-btn--outline" type="button" aria-pressed={showPw} onClick={() => setShowPw((s) => !s)}>
              {showPw ? '숨기기' : '보기'}
            </button>
          }
        />
        <fieldset style={{ margin: 0, padding: 0, border: 'none', display: 'flex', flexDirection: 'column' }}>
          <legend className="t-field__label" style={{ padding: 0, marginBottom: 4 }}>
            확인과 동의
          </legend>
          <Agree all checked={allChecked} onChange={(v) => setChecks({ age: v, terms: v, privacy: v, rules: v })}>
            모두 확인하고 동의해요
          </Agree>
          <Agree required checked={checks.age} onChange={(v) => setChecks((c) => ({ ...c, age: v }))}>
            만 14세 이상이에요
          </Agree>
          <Agree required checked={checks.terms} onChange={(v) => setChecks((c) => ({ ...c, terms: v }))} readLabel="이용약관" onRead={() => setLegal('terms')}>
            이용약관에 동의해요
          </Agree>
          <Agree required checked={checks.privacy} onChange={(v) => setChecks((c) => ({ ...c, privacy: v }))} readLabel="개인정보 처리방침" onRead={() => setLegal('privacy')}>
            개인정보 처리방침에 동의해요
          </Agree>
          <Agree required checked={checks.rules} onChange={(v) => setChecks((c) => ({ ...c, rules: v }))} readLabel="이용 규칙" onRead={() => setLegal('rules')}>
            이용 규칙을 읽었어요
          </Agree>
        </fieldset>
        <p className="t-field__help">받는 개인정보는 이메일 하나예요. 캐릭터 설정과 대화는 게임 안의 기록이에요.</p>
      </Frame>
      {legal && <LegalSheet kind={legal} onClose={() => setLegal(null)} />}
    </>
  );
}
