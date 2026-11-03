import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router';
import { BALANCE } from '../../config/balance';
import { useSession } from '../../lib/session';
import { ago, clockKST, dateKST } from '../../lib/time';
import { api } from '../../services';
import { Frame, ScreenHeader } from '../../shell/Frame';
import { MOD_ACTION_LABEL, REPORT_REASON_LABEL, REPORT_TARGET_LABEL, type ModAction, type ModRequest, type ReportCase, type Sanction } from '../../types/domain';
import { TextArea } from '../../ui/Field';
import { Loading } from '../../ui/Loading';
import { PickGroup } from '../../ui/Pick';
import { Sheet } from '../../ui/Sheet';
import { useToast } from '../../ui/Toast';

/** 운영자만 들어온다. 화면을 숨기는 것은 편의이고, 막는 것은 서버 함수의 권한 확인이다. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { session } = useSession();
  if (!session?.admin) return <Navigate to="/settings" replace />;
  return children;
}

const when = (iso: string) => {
  const { month, day } = dateKST(new Date(iso));
  return `${month}.${String(day).padStart(2, '0')} ${clockKST(iso)}`;
};

const TABS = [
  { to: '/admin', label: '기다리는 신고' },
  { to: '/admin/done', label: '처리한 신고' },
  { to: '/admin/sanctions', label: '제재' },
  { to: '/admin/log', label: '조치 기록' },
];

function AdminFrame({ title, children, back }: { title: string; children: ReactNode; back?: { to: string; label: string } }) {
  const { pathname } = useLocation();
  return (
    <Frame
      plate="운영"
      ingame
      header={<ScreenHeader title={title} sub="운영" back={back ?? { to: '/settings', label: '단말 설정으로' }} />}
      scrollLabel={title}
      deskClass="app-desk--narrow"
    >
      {!back && (
        <nav aria-label="운영 메뉴" className="app-admin-tabs">
          {TABS.map((t) => (
            <Link key={t.to} className="t-tab" to={t.to} aria-current={pathname === t.to ? 'page' : undefined}>
              {t.label}
            </Link>
          ))}
        </nav>
      )}
      {children}
    </Frame>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="t-empty t-empty--form">
      <p className="t-empty__title">{title}</p>
      <p className="t-empty__text">{text}</p>
    </div>
  );
}

function ContentState({ r }: { r: ReportCase }) {
  if (r.content === 'deleted') return <span className="t-status t-status--danger">지움</span>;
  if (r.content === 'hidden') return <span className="t-status t-status--warn">{r.autoHidden ? '자동으로 숨김' : '숨김'}</span>;
  return <span className="t-status">보이는 중</span>;
}

// ── 신고 목록 ──

export function ReportListScreen({ status }: { status: 'open' | 'done' }) {
  const [list, setList] = useState<ReportCase[] | null>(null);
  useEffect(() => {
    setList(null);
    void api.listReports(status).then(setList);
  }, [status]);
  const title = status === 'open' ? '기다리는 신고' : '처리한 신고';
  return (
    <AdminFrame title="신고와 조치">
      <h2 className="t-label" style={{ margin: 0 }}>
        {title} {list ? `${list.length}건` : ''}
      </h2>
      {!list ? (
        <Loading text="신고 기록을 불러오는 중" />
      ) : list.length === 0 ? (
        <Empty title={status === 'open' ? '기다리는 신고가 없어요' : '처리한 신고가 없어요'} text={status === 'open' ? '새 신고가 들어오면 여기에 쌓여요.' : '처리를 마친 신고가 여기에 남아요.'} />
      ) : (
        <ul className="app-mod-list">
          {list.map((r) => (
            <li key={r.id}>
              <Link className="app-mod-row" to={`/admin/report/${r.id}`}>
                <span className="app-mod-row__top">
                  <span>{REPORT_TARGET_LABEL[r.targetKind]}</span>
                  <span>
                    신고 {r.count}건 · {ago(r.lastAt)}
                  </span>
                </span>
                <span className="app-mod-row__text">{r.excerpt}</span>
                <span className="app-mod-row__meta">
                  {r.author.name} · {r.where}
                </span>
                <span className="app-mod-row__tags">
                  <ContentState r={r} />
                  {r.reasons.map((x) => (
                    <span key={x.reason} className="t-status t-status--info">
                      {REPORT_REASON_LABEL[x.reason].split(' (')[0]}
                      {x.count > 1 ? ` ${x.count}` : ''}
                    </span>
                  ))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {status === 'open' && (
        <p className="t-field__help" style={{ margin: 0 }}>
          같은 내용에 신고가 {BALANCE.reportAutoHide}건 쌓이면 확인하기 전까지 자동으로 숨겨요. 자동으로 숨긴 것과 신고가 많은 것부터 보여요.
        </p>
      )}
    </AdminFrame>
  );
}

// ── 신고 하나 ──

type Pending = { req: ModRequest; title: string; body: string; ok: string } | null;

export function ReportScreen() {
  const { id = '' } = useParams();
  const toast = useToast();
  const [r, setR] = useState<ReportCase | null | undefined>(undefined);
  const [memo, setMemo] = useState('');
  const [sanction, setSanction] = useState<'warn' | 'suspend' | 'ban' | null>(null);
  const [days, setDays] = useState<string>(String(BALANCE.suspendDays[1]));
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<Pending>(null);

  useEffect(() => {
    void api.getReport(id).then(setR);
  }, [id]);

  const act = useCallback(
    async (req: ModRequest, done: string) => {
      setBusy(true);
      const res = await api.actOnReport(id, req);
      setBusy(false);
      setConfirm(null);
      if (!res.ok) return toast({ kind: 'danger', text: res.message });
      // 메모는 그대로 둔다: 숨기고 나서 제재할 때 같은 사유를 다시 쓰지 않게.
      setR(res.value);
      setSanction(null);
      toast({ kind: 'ok', text: done });
    },
    [id, toast],
  );

  if (r === undefined) return <AdminFrame title="신고" back={{ to: '/admin', label: '신고 목록으로' }}><Loading text="신고 기록을 불러오는 중" /></AdminFrame>;
  if (r === null)
    return (
      <AdminFrame title="신고" back={{ to: '/admin', label: '신고 목록으로' }}>
        <Empty title="신고를 찾지 못했어요" text="목록으로 돌아가 다시 골라 주세요." />
      </AdminFrame>
    );

  const open = r.status === 'open';
  const deleted = r.content === 'deleted';
  const m = memo.trim();

  function applySanction() {
    if (!sanction) return;
    if (sanction === 'ban') {
      setConfirm({
        req: { kind: 'ban', memo: m },
        title: '영구 정지할까요?',
        body: `${r!.account.label}은 다시 로그인할 수 없게 돼요. 계정의 캐릭터 ${r!.account.characters}명과 기록은 지우지 않고 남겨 둬요. 제재 목록에서 풀 수 있지만, 정지된 동안의 접속은 되돌릴 수 없어요.`,
        ok: '영구 정지하기',
      });
      return;
    }
    if (sanction === 'suspend') void act({ kind: 'suspend', memo: m, days: Number(days) }, `${days}일 정지를 걸었어요.`);
    else void act({ kind: 'warn', memo: m }, '경고를 남겼어요.');
  }

  return (
    <AdminFrame title={`${REPORT_TARGET_LABEL[r.targetKind]} 신고`} back={{ to: open ? '/admin' : '/admin/done', label: '신고 목록으로' }}>
      <section aria-labelledby="mod-what" className="app-setting">
        <h2 id="mod-what" className="t-label" style={{ margin: 0 }}>
          신고된 내용
        </h2>
        <div className="app-mod-quote">
          <span className="app-mod-row__tags">
            <ContentState r={r} />
            <span className={open ? 't-status t-status--warn' : 't-status t-status--ok'}>{open ? '처리 기다림' : '처리함'}</span>
          </span>
          <p className={deleted ? 'app-mod-quote__text app-mod-quote__text--gone' : 'app-mod-quote__text'}>{deleted ? '지운 내용이에요.' : r.excerpt}</p>
        </div>
        <div className="t-cells">
          <div className="t-cell">
            <span className="t-cell__k">쓴 캐릭터</span>
            <span className="t-cell__v">{r.author.name}</span>
          </div>
          <div className="t-cell">
            <span className="t-cell__k">있던 곳</span>
            <span className="t-cell__v">{r.where}</span>
          </div>
          <div className="t-cell t-cell--wide">
            <span className="t-cell__k">작성자 계정</span>
            <span className="t-cell__v">
              {r.account.label} · 캐릭터 {r.account.characters}명 · 지난 제재 {r.account.sanctions}건
            </span>
          </div>
          <div className="t-cell t-cell--wide">
            <span className="t-cell__k">신고</span>
            <span className="t-cell__v">
              {r.count}건 · 처음 {when(r.firstAt)} · 마지막 {when(r.lastAt)}
            </span>
          </div>
        </div>
        <ul className="app-mod-reasons">
          {r.reasons.map((x) => (
            <li key={x.reason}>
              {REPORT_REASON_LABEL[x.reason]} <b>{x.count}건</b>
            </li>
          ))}
        </ul>
        {r.memos.length > 0 && (
          <div className="app-mod-memos">
            <span className="t-cell__k">신고한 사람이 남긴 말</span>
            {r.memos.map((x, i) => (
              <p key={i}>{x}</p>
            ))}
          </div>
        )}
        <p className="t-field__help" style={{ margin: 0 }}>
          누가 신고했는지는 운영 화면에도 보이지 않아요.
        </p>
      </section>

      {!deleted && (
        <section aria-labelledby="mod-act" className="app-setting">
          <h2 id="mod-act" className="t-label" style={{ margin: 0 }}>
            조치
          </h2>
          <TextArea label="조치 메모" optional="조치 기록에 함께 남아요" value={memo} onChange={setMemo} max={200} rows={2} />
          <div className="app-mod-actions">
            {r.content === 'hidden' ? (
              <button className="t-btn t-btn--outline" type="button" disabled={busy} onClick={() => void act({ kind: 'unhide', memo: m }, '다시 보이게 했어요.')}>
                다시 보이기
              </button>
            ) : (
              <button className="t-btn t-btn--solid" type="button" disabled={busy} onClick={() => void act({ kind: 'hide', memo: m }, '숨겼어요. 다시 보이게 할 수 있어요.')}>
                숨기기
              </button>
            )}
            {open && (
              <button className="t-btn t-btn--outline" type="button" disabled={busy} onClick={() => void act({ kind: 'dismiss', memo: m }, '문제없음으로 닫았어요.')}>
                문제없음
              </button>
            )}
            <button
              className="t-btn t-btn--danger"
              type="button"
              disabled={busy}
              onClick={() =>
                setConfirm({
                  req: { kind: 'delete', memo: m },
                  title: '이 내용을 지울까요?',
                  body: `${r.author.name}의 ${REPORT_TARGET_LABEL[r.targetKind]}가 모두에게서 사라지고 되돌릴 수 없어요. 신고와 조치 기록은 남아요.`,
                  ok: '지우기',
                })
              }
            >
              지우기
            </button>
          </div>
          <p className="t-field__help" style={{ margin: 0 }}>
            {r.content === 'hidden' ? '숨긴 내용은 작성자에게만 보여요.' : '숨기면 작성자에게만 보이고, 언제든 다시 보이게 할 수 있어요.'} 문제없음은 자동으로 숨긴 내용을 다시 보이게 하고 신고를 닫아요.
          </p>
        </section>
      )}

      <section aria-labelledby="mod-sanction" className="app-setting">
        <h2 id="mod-sanction" className="t-label" style={{ margin: 0 }}>
          작성자 제재
        </h2>
        <PickGroup<'warn' | 'suspend' | 'ban'>
          legend="제재 종류"
          row
          value={sanction}
          onChange={setSanction}
          options={[
            { value: 'warn', title: '경고', desc: '작성자에게 알리고 기록만 남겨요' },
            { value: 'suspend', title: '기간 정지', desc: '정한 날만큼 로그인할 수 없어요' },
            { value: 'ban', title: '영구 정지', desc: '풀기 전까지 로그인할 수 없어요' },
          ]}
        />
        {sanction === 'suspend' && (
          <PickGroup<string>
            legend="정지 기간"
            row
            value={days}
            onChange={setDays}
            options={BALANCE.suspendDays.map((d) => ({ value: String(d), title: `${d}일` }))}
          />
        )}
        <button className={sanction === 'ban' ? 't-btn t-btn--danger' : 't-btn t-btn--outline'} type="button" disabled={!sanction || busy} onClick={applySanction} style={{ alignSelf: 'flex-start' }}>
          {sanction === 'ban' ? '영구 정지하기' : sanction === 'suspend' ? `${days}일 정지하기` : '경고 남기기'}
        </button>
        <p className="t-field__help" style={{ margin: 0 }}>
          제재는 내용과 따로 남아요. 위의 조치 메모가 제재 사유로 함께 기록돼요.
        </p>
      </section>

      {open && (deleted || r.actions.some((a) => a.kind === 'hide' || a.kind === 'warn' || a.kind === 'suspend' || a.kind === 'ban')) && (
        <button className="t-btn t-btn--solid" type="button" disabled={busy} onClick={() => void act({ kind: 'close', memo: m }, '처리를 마쳤어요.')}>
          처리 끝내기
        </button>
      )}

      <section aria-labelledby="mod-hist" className="app-setting">
        <h2 id="mod-hist" className="t-label" style={{ margin: 0 }}>
          이 신고의 조치 기록
        </h2>
        {r.actions.length ? <LogList items={r.actions} /> : <p className="t-field__help" style={{ margin: 0 }}>아직 조치하지 않았어요.</p>}
      </section>

      {confirm && (
        <Sheet title={confirm.title} onClose={() => setConfirm(null)} labelId="mod-confirm-t" tone="danger">
          <p className="t-reading" style={{ margin: 0, fontSize: 15 }}>
            {confirm.body}
          </p>
          <div className="t-dialog__actions">
            <button className="t-btn t-btn--outline" type="button" onClick={() => setConfirm(null)}>
              그만두기
            </button>
            <button className="t-btn t-btn--danger" type="button" disabled={busy} onClick={() => void act(confirm.req, confirm.req.kind === 'ban' ? '영구 정지했어요.' : '지웠어요.')}>
              {confirm.ok}
            </button>
          </div>
        </Sheet>
      )}
    </AdminFrame>
  );
}

// ── 조치 기록 ──

function LogList({ items }: { items: ModAction[] }) {
  return (
    <ol className="app-mod-log">
      {items.map((a) => (
        <li key={a.id}>
          <span className="app-mod-row__top">
            <b>{MOD_ACTION_LABEL[a.kind]}</b>
            <span>{when(a.at)}</span>
          </span>
          <span className="app-mod-row__meta">{a.target}</span>
          {a.until && <span className="app-mod-row__meta">풀리는 때 {when(a.until)}</span>}
          {a.memo && <span className="app-mod-log__memo">{a.memo}</span>}
          <span className="app-mod-row__meta">처리: {a.by}</span>
        </li>
      ))}
    </ol>
  );
}

export function ModLogScreen() {
  const [log, setLog] = useState<ModAction[] | null>(null);
  useEffect(() => {
    void api.listModLog().then(setLog);
  }, []);
  return (
    <AdminFrame title="신고와 조치">
      <h2 className="t-label" style={{ margin: 0 }}>
        조치 기록
      </h2>
      {!log ? <Loading text="조치 기록을 불러오는 중" /> : log.length ? <LogList items={log} /> : <Empty title="아직 조치 기록이 없어요" text="숨기기, 지우기, 제재를 하면 여기에 남아요." />}
      <p className="t-field__help" style={{ margin: 0 }}>
        모든 신고 처리와 제재는 지우지 않고 남겨요. 언제, 무엇을, 어떻게 처리했는지의 근거예요.
      </p>
    </AdminFrame>
  );
}

// ── 제재 목록 ──

export function SanctionsScreen() {
  const toast = useToast();
  const [list, setList] = useState<Sanction[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(() => void api.listSanctions().then(setList), []);
  useEffect(load, [load]);

  async function lift(s: Sanction) {
    setBusy(s.id);
    const r = await api.liftSanction(s.id, '');
    setBusy(null);
    if (!r.ok) return toast({ kind: 'danger', text: r.message });
    toast({ kind: 'ok', text: `${s.accountLabel}의 ${MOD_ACTION_LABEL[s.kind]}를 풀었어요.` });
    load();
  }

  const active = list?.filter((s) => s.active) ?? [];
  const past = list?.filter((s) => !s.active) ?? [];
  const row = (s: Sanction) => (
    <li key={s.id}>
      <span className="app-mod-row__top">
        <b>{MOD_ACTION_LABEL[s.kind]}</b>
        <span>{when(s.at)}</span>
      </span>
      <span className="app-mod-row__meta">{s.accountLabel}</span>
      {s.until && <span className="app-mod-row__meta">풀리는 때 {when(s.until)}</span>}
      <span className="app-mod-log__memo">{s.reason}</span>
      {s.active && s.kind !== 'warn' && (
        <button className="t-btn t-btn--outline" type="button" disabled={busy === s.id} onClick={() => void lift(s)} style={{ alignSelf: 'flex-start' }}>
          제재 풀기
        </button>
      )}
    </li>
  );

  return (
    <AdminFrame title="신고와 조치">
      {!list ? (
        <Loading text="제재 기록을 불러오는 중" />
      ) : (
        <>
          <h2 className="t-label" style={{ margin: 0 }}>
            걸려 있는 제재 {active.length}건
          </h2>
          {active.length ? <ol className="app-mod-log">{active.map(row)}</ol> : <Empty title="걸려 있는 정지가 없어요" text="신고 화면에서 작성자를 제재하면 여기에 보여요." />}
          {past.length > 0 && (
            <>
              <h2 className="t-label" style={{ margin: 0 }}>
                지난 제재와 경고 {past.length}건
              </h2>
              <ol className="app-mod-log">{past.map(row)}</ol>
            </>
          )}
        </>
      )}
      <p className="t-field__help" style={{ margin: 0 }}>
        경고는 기록만 남아요. 기간 정지는 날짜가 지나면 저절로 풀려요. 풀어도 기록은 남아요.
      </p>
    </AdminFrame>
  );
}
