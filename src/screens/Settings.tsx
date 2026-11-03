import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { BALANCE } from '../config/balance';
import { loadMotion, saveMotion, type MotionPref } from '../lib/motion';
import { useSession } from '../lib/session';
import { detectPlatform, isStandalone } from '../lib/useIsDesktop';
import { api } from '../services';
import { Frame, ScreenHeader } from '../shell/Frame';
import { NOTIFY_KINDS, type NotificationSettings, type NotifyKind } from '../types/domain';
import { Loading } from '../ui/Loading';
import { PickGroup } from '../ui/Pick';
import { Px } from '../ui/Px';
import { Switch } from '../ui/Switch';
import { useToast } from '../ui/Toast';
import { LEGAL_TITLE, LegalSheet, type LegalKind } from './Auth';

type Perm = NotificationPermission | 'unsupported';

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="app-setting">
      <h2 id={id} className="t-label" style={{ margin: 0 }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** 알림이 묶여 오는 모양을 한 줄로 보여 준다. 켠 종류만 들어간다. */
function previewLine(n: NotificationSettings, name: string) {
  const parts: string[] = [];
  if (n.kinds.send) parts.push(`${name}의 출동이 끝났어요`);
  if (n.kinds.talk) parts.push('말 걸기 2건');
  if (n.kinds.relation) parts.push('관계 신청 1건');
  if (n.kinds.care) parts.push('케어 요청 1건');
  return parts.length ? parts.join(' · ') : null;
}

/** 단말 설정: 알림, 밤 시간, 동작 줄이기, 계정. */
export function SettingsScreen() {
  const { session, characters, refresh } = useSession();
  const nav = useNavigate();
  const toast = useToast();
  const [n, setN] = useState<NotificationSettings | null>(null);
  const [perm, setPerm] = useState<Perm>(() => ('Notification' in window ? Notification.permission : 'unsupported'));
  const [motion, setMotion] = useState<MotionPref>(loadMotion);
  const [legal, setLegal] = useState<LegalKind | null>(null);

  useEffect(() => {
    void api.getNotificationSettings().then(setN);
  }, []);

  if (!n) return <Frame plate="단말" ingame><Loading text="단말 설정을 불러오는 중" /></Frame>;

  // 바꾸는 즉시 저장한다. 실패하면 화면을 되돌리고 알린다.
  async function update(next: NotificationSettings) {
    const prev = n;
    setN(next);
    const r = await api.saveNotificationSettings(next);
    if (!r.ok) {
      setN(prev);
      toast({ kind: 'danger', text: r.message });
    }
  }
  const setKind = (k: NotifyKind, v: boolean) => n && void update({ ...n, kinds: { ...n.kinds, [k]: v } });

  async function enable() {
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p === 'granted') {
      // TODO: 서비스 워커의 pushManager.subscribe(VAPID 공개 키)로 구독을 만들어 넘긴다 (Supabase 연결 단계).
      await api.savePushSubscription(null);
      toast({ kind: 'ok', text: '알림을 켰어요.' });
    }
  }

  async function signOut() {
    await api.signOut();
    await refresh();
    nav('/login', { replace: true });
  }

  const iosNotInstalled = detectPlatform() === 'ios' && !isStandalone();
  const preview = previewLine(n, characters[0]?.name ?? '[캐릭터]');
  const permText: Record<Perm, string> = {
    granted: '이 기기로 알림이 와요.',
    default: '아직 켜지 않았어요.',
    denied: '브라우저에서 알림을 막아 두었어요. 브라우저의 사이트 설정에서 알림을 허용하면 다시 켤 수 있어요.',
    unsupported: '이 브라우저는 알림을 받을 수 없어요.',
  };

  return (
    <Frame plate="단말" ingame header={<ScreenHeader title="단말 설정" sub="CH.05" back={{ to: '/home', label: '상황판으로' }} />} scrollLabel="단말 설정" deskClass="app-desk--narrow">
      <Section id="st-push" title="알림 받기">
        <div className="app-runbox">
          <span style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 0 }}>
            <Px name="envelope" />
            <span>{permText[perm]}</span>
          </span>
          <span className={perm === 'granted' ? 't-status t-status--ok' : perm === 'denied' ? 't-status t-status--warn' : 't-status'} style={{ whiteSpace: 'nowrap' }}>
            {perm === 'granted' ? '켜짐' : perm === 'denied' ? '막힘' : perm === 'unsupported' ? '지원 안 함' : '꺼짐'}
          </span>
        </div>
        {iosNotInstalled ? (
          <Link className="t-btn t-btn--outline" to="/install">
            아이폰은 홈 화면에 두어야 알림이 와요
          </Link>
        ) : (
          perm === 'default' && (
            <button className="t-btn t-btn--solid" type="button" onClick={() => void enable()}>
              이 기기로 알림 받기
            </button>
          )
        )}
        <p className="t-field__help" style={{ margin: 0 }}>
          알림을 끄더라도 다시 접속하면 "오늘 한눈에"에서 모든 결과를 볼 수 있어요.
        </p>
      </Section>

      <Section id="st-kinds" title="받을 알림">
        <div className="app-setting__list">
          {NOTIFY_KINDS.map((k) => (
            <Switch key={k.kind} label={k.label} checked={n.kinds[k.kind]} onChange={(v) => setKind(k.kind, v)} note={k.desc} />
          ))}
        </div>
      </Section>

      <Section id="st-night" title="밤 시간">
        <Switch
          label={`밤에는 모아서 아침에 받기 (${BALANCE.quietHours.start}~${BALANCE.quietHours.end})`}
          checked={n.quietNight}
          onChange={(v) => void update({ ...n, quietNight: v })}
          note={n.quietNight ? '밤사이 생긴 알림은 아침에 한 번에 묶어 보내요.' : '밤에도 바로 보내요.'}
        />
      </Section>

      <Section id="st-preview" title="이렇게 와요">
        {preview ? (
          <div className="app-notice-preview" role="img" aria-label={`알림 예시: ${preview}`}>
            <Px name="monitor" small />
            <span>{preview}</span>
          </div>
        ) : (
          <p className="t-reading" style={{ margin: 0, fontSize: 15 }}>
            받을 알림을 모두 껐어요. 결과는 "오늘 한눈에"에서 볼 수 있어요.
          </p>
        )}
        <p className="t-field__help" style={{ margin: 0 }}>
          짧은 시간에 여러 알림이 생기면 하나로 묶어 보내요. 알림마다 어느 캐릭터의 일인지 이름을 붙여요.
        </p>
      </Section>

      <Section id="st-motion" title="화면">
        <PickGroup<MotionPref>
          legend="동작 줄이기"
          row
          value={motion}
          onChange={(v) => {
            setMotion(v);
            saveMotion(v);
          }}
          options={[
            { value: 'system', title: '기기 설정 따르기' },
            { value: 'reduce', title: '항상 줄이기' },
          ]}
          note="줄이면 판정 바늘 연출, 빛 번짐, 깜빡임을 끄고 결과만 바로 보여 줘요. 이 기기에만 저장돼요."
        />
      </Section>

      <Section id="st-account" title="계정">
        <div className="t-cells" style={{ gridTemplateColumns: '1fr' }}>
          <div className="t-cell">
            <span className="t-cell__k">이메일</span>
            <span className="t-cell__v" style={{ overflowWrap: 'anywhere' }}>
              {session?.email}
            </span>
          </div>
        </div>
        <div className="app-setting__links">
          {(Object.keys(LEGAL_TITLE) as LegalKind[]).map((k) => (
            <button key={k} type="button" className="t-btn t-btn--ghost" onClick={() => setLegal(k)}>
              {LEGAL_TITLE[k]}
            </button>
          ))}
          {!isStandalone() && (
            <Link className="t-btn t-btn--ghost" to="/install">
              홈 화면에 두기
            </Link>
          )}
        </div>
        <button className="t-btn t-btn--outline" type="button" onClick={() => void signOut()} style={{ alignSelf: 'flex-start' }}>
          로그아웃
        </button>
      </Section>
      {legal && <LegalSheet kind={legal} onClose={() => setLegal(null)} />}
    </Frame>
  );
}
