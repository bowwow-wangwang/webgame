import type { ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { CEASEFIRE_YEAR_AT_OPEN, GAME_TITLE } from '../config/game';
import { useIsDesktop } from '../lib/useIsDesktop';
import { dateKST, clockKST } from '../lib/time';
import { TodayList } from './Today';
import { Px } from '../ui/Px';
import type { PixelIconName } from '../ui/pixelIcons';

/** 단말 본체의 각인 띠. 장식이라 화면 낭독기에서는 숨긴다. */
function Plate({ right }: { right: string }) {
  return (
    <div className="t-app__plate" aria-hidden="true">
      <span className="t-bezel__power" />
      <span>생체 반응 감시 단말</span>
      <span className="t-bezel__vent" />
      <span>{right}</span>
    </div>
  );
}

const MENU: { to: string; ch: string; label: string; icon: PixelIconName; also?: string[] }[] = [
  { to: '/home', ch: '1', label: '상황판', icon: 'monitor' },
  { to: '/talk', ch: '2', label: '통신', icon: 'radio', also: ['/place/', '/dm/'] },
  { to: '/send', ch: '3', label: '보내두기', icon: 'compass', also: ['/sent/'] },
  { to: '/record', ch: '4', label: '기록', icon: 'folder', also: ['/dossier/', '/directory'] },
  { to: '/settings', ch: '5', label: '단말', icon: 'gear' },
];

function useCurrentMenu() {
  const { pathname } = useLocation();
  return MENU.find((m) => pathname === m.to || pathname.startsWith(`${m.to}/`) || m.also?.some((a) => pathname.startsWith(a)))?.to;
}

function NavBar() {
  const cur = useCurrentMenu();
  return (
    <nav className="t-navbar" aria-label="주 메뉴">
      {MENU.map((m) => (
        <NavLink key={m.to} to={m.to} className="t-navbar__item" aria-current={cur === m.to ? 'page' : undefined}>
          <span className="t-navbar__dot" />
          <Px name={m.icon} small />
          <span className="t-navbar__label">{m.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function SideNav() {
  const cur = useCurrentMenu();
  return (
    <nav className="t-sidenav" aria-label="주 메뉴">
      {MENU.map((m) => (
        <NavLink key={m.to} to={m.to} className="t-sidenav__item" aria-current={cur === m.to ? 'page' : undefined}>
          <span className="t-sidenav__key" aria-hidden="true">
            [{m.ch}]
          </span>
          <Px name={m.icon} small />
          <span>{m.label}</span>
          <span />
        </NavLink>
      ))}
    </nav>
  );
}

function StatusBar({ keys }: { keys: [string, string][] }) {
  const { month, day } = dateKST();
  return (
    <footer className="t-statusbar" aria-label="단말 상태">
      <span className="t-statusbar__now">
        휴전 {CEASEFIRE_YEAR_AT_OPEN}년차 {month}.{String(day).padStart(2, '0')}
      </span>
      <span>{clockKST(new Date())}</span>
      <span className="t-statusbar__keys">
        {keys.map(([k, v]) => (
          <span key={k}>
            <b>{k}</b> {v}
          </span>
        ))}
      </span>
    </footer>
  );
}

export function ScreenHeader({ title, sub, back, right }: { title: string; sub?: string; back?: { to: string; label: string }; right?: ReactNode }) {
  return (
    <header className="app-header">
      {back ? (
        <Link to={back.to} aria-label={back.label} className="app-header__back">
          <svg className="t-ico" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 6l-6 6l6 6" />
          </svg>
        </Link>
      ) : (
        <span className="app-header__spacer" />
      )}
      <div className="app-header__titles">
        {sub && <span className="t-label">{sub}</span>}
        <h1 className="t-pixel t-glow app-header__title">{title}</h1>
      </div>
      {right}
    </header>
  );
}

/**
 * 모든 화면의 틀. 폭이 넓으면 PC 배치(왼쪽 칸 + 본문 + 오른쪽 칸 + 상태 막대), 좁으면 모바일 배치.
 * - left: PC에서 왼쪽 칸에 둘 것. 없으면 게임 안 화면은 메뉴를, 바깥 화면(로그인 등)은 비운다.
 * - right: PC 오른쪽 칸. 모바일에서는 본문 아래로 내려가지 않고 숨긴다 (같은 정보가 본문에 있어야 한다).
 * - bar: 아래 조작 막대. 모바일은 화면 맨 아래, PC는 본문 칸의 맨 아래.
 */
export function Frame({
  plate,
  header,
  children,
  bar,
  left,
  right,
  ingame,
  keys = [],
  scrollLabel,
  onSubmit,
  deskClass = '',
  flush,
  mobileNav,
}: {
  plate: string;
  header?: ReactNode;
  children: ReactNode;
  bar?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  ingame?: boolean;
  keys?: [string, string][];
  scrollLabel?: string;
  /** 있으면 본문과 아래 조작 막대를 한 폼으로 묶는다 (Enter로 다음, 막대의 버튼이 제출). */
  onSubmit?: () => void;
  /** PC 배치의 칸 나누기를 화면이 바꿀 때 (예: 로그인 화면의 넓은 소개 칸). */
  deskClass?: string;
  /** 대화처럼 본문이 칸 끝까지 차는 화면: 안쪽 여백을 없앤다. */
  flush?: boolean;
  /** 모바일 아래 화면 선택 줄. 기본은 게임 안 화면이면 보인다 (대화방은 입력줄을 두려고 숨긴다). */
  mobileNav?: boolean;
}) {
  const desktop = useIsDesktop();

  const inner = (
    <>
      <div className={flush ? 't-scroll app-scroll app-scroll--flush' : 't-scroll app-scroll'} tabIndex={0} aria-label={scrollLabel}>
        {children}
      </div>
      {bar}
    </>
  );
  const body = (
    <>
      {header}
      {onSubmit ? (
        <form
          className="app-formwrap"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          {inner}
        </form>
      ) : (
        inner
      )}
    </>
  );

  if (!desktop) {
    return (
      <div className="t-app t-screen app-root" data-theme="terminal">
        <Plate right={plate} />
        <main className="t-app__screen">{body}</main>
        {(mobileNav ?? ingame) && <NavBar />}
      </div>
    );
  }

  const sidebar =
    left ??
    (ingame ? (
      <aside className="t-sidebar" aria-label="단말 메뉴">
        <div className="app-brand">
          <span className="t-label">{GAME_TITLE}</span>
          <span className="t-pixel t-glow" style={{ fontSize: 17 }}>
            휴전 {CEASEFIRE_YEAR_AT_OPEN}년차
          </span>
        </div>
        <SideNav />
        <section aria-labelledby="mine-h" className="app-mine">
          <h2 id="mine-h" className="t-label">
            내 캐릭터 오늘
          </h2>
          <TodayList compact />
        </section>
      </aside>
    ) : null);

  return (
    <div className="t-app t-app--desktop t-screen app-root" data-theme="terminal">
      <Plate right={`${plate} · 탁상형`} />
      <main className="t-app__screen">
        <div className={`app-desk ${sidebar ? 'app-desk--left' : ''} ${right ? 'app-desk--right' : ''} ${deskClass}`}>
          {sidebar}
          <section className="app-desk__center" aria-label={scrollLabel}>
            {body}
          </section>
          {right && <aside className="app-desk__right">{right}</aside>}
        </div>
        <StatusBar keys={ingame ? [['[1]~[5]', '화면'], ...keys] : keys} />
      </main>
    </div>
  );
}

export function FormBar({ prev, next, nextDisabled, onPrev, busy }: { prev?: string; next: string; nextDisabled?: boolean; onPrev?: () => void; busy?: boolean }) {
  return (
    <div className="t-formbar">
      {prev && (
        <button className="t-btn t-btn--outline" type="button" onClick={onPrev}>
          {prev}
        </button>
      )}
      <button className="t-btn t-btn--primary" type="submit" disabled={nextDisabled} aria-busy={busy || undefined}>
        {next}
      </button>
    </div>
  );
}
