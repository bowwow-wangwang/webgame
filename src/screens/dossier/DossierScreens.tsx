import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { useIsDesktop } from '../../lib/useIsDesktop';
import { useSession } from '../../lib/session';
import { josa } from '../../lib/josa';
import { ago } from '../../lib/time';
import { api } from '../../services';
import { Frame, ScreenHeader } from '../../shell/Frame';
import {
  REL_DESC,
  REL_LABEL,
  ROLE_LABEL,
  type Activity,
  type DirectoryEntry,
  type Dossier,
  type Persona,
  type RelationRequest,
  type RelKind,
  type Role,
} from '../../types/domain';
import { Face } from '../../ui/chat/Chat';
import { TextField } from '../../ui/Field';
import { Loading } from '../../ui/Loading';
import { PickGroup } from '../../ui/Pick';
import { Px } from '../../ui/Px';
import { Sheet } from '../../ui/Sheet';
import { useToast } from '../../ui/Toast';
import { DossierPage1, DossierPage2 } from './DossierPaper';

function useMine(): Persona[] {
  const { characters } = useSession();
  return characters.map((c) => ({ id: c.id, name: c.name, role: c.role, portraitUrl: c.portraitUrl, mine: true }));
}

/** 관계 신청 판. 내 캐릭터끼리(자관)면 동의 없이 바로 이어진다고 미리 알려 준다. */
function RelationSheet({ target, onClose, onDone }: { target: Persona; onClose: () => void; onDone: () => void }) {
  const mine = useMine().filter((m) => m.id !== target.id);
  const toast = useToast();
  const [from, setFrom] = useState<string | null>(mine[0]?.id ?? null);
  const [kind, setKind] = useState<RelKind | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const me = mine.find((m) => m.id === from);
  const careOk = me && ((me.role === 'ability' && target.role === 'staff') || (me.role === 'staff' && target.role === 'ability'));
  const kinds: RelKind[] = ['lost', 'settlement', 'care', 'trip', 'free'];

  async function submit() {
    if (!from || !kind || busy) return;
    setBusy(true);
    const r = await api.requestRelation({ fromId: from, toId: target.id, kind, note });
    setBusy(false);
    if (!r.ok) return toast({ kind: 'danger', text: r.message });
    toast({
      kind: 'ok',
      text: r.value.instant
        ? `${josa(me?.name ?? '', '와/과')} ${josa(target.name, '이/가')} ${josa(REL_LABEL[kind], '으로/로')} 이어졌어요.`
        : `관계 신청을 보냈어요. ${target.name}의 주인이 받아들이면 이어져요.`,
    });
    onDone();
  }

  return (
    <Sheet title={`${target.name}에게 관계 신청`} onClose={onClose} labelId="rel-t">
      {mine.length > 1 && (
        <PickGroup legend="내 캐릭터" row value={from} onChange={setFrom} options={mine.map((m) => ({ value: m.id, title: m.name }))} />
      )}
      <PickGroup<RelKind>
        legend="어떤 사이인가요"
        value={kind}
        onChange={setKind}
        options={kinds.map((k) => ({
          value: k,
          title: REL_LABEL[k],
          desc: k === 'care' && !careOk ? '능력자와 재단 직원 사이에만 맺을 수 있어요.' : REL_DESC[k],
          disabled: k === 'care' && !careOk,
        }))}
      />
      <TextField
        label={kind === 'free' ? '관계 이름' : '관계 한 줄'}
        optional={kind === 'free' ? undefined : '쓰지 않아도 돼요'}
        value={note}
        onChange={setNote}
        max={40}
        help={target.mine ? '내 캐릭터끼리라 신청 없이 바로 이어져요.' : '상대 주인이 받아들이면 두 판독지의 "참고인과 관계"에 함께 남아요.'}
      />
      <div className="t-dialog__actions">
        <button className="t-btn t-btn--outline" type="button" onClick={onClose}>
          그만두기
        </button>
        <button className="t-btn t-btn--solid" type="button" disabled={!from || !kind || (kind === 'free' && !note.trim())} aria-busy={busy || undefined} onClick={() => void submit()}>
          {target.mine ? '바로 잇기' : '신청 보내기'}
        </button>
      </div>
    </Sheet>
  );
}

/** M-16 · M-17 판독지 1쪽과 2쪽. 남의 판독지면 아래에 말 걸기와 관계 신청. */
export function DossierScreen({ page }: { page: 1 | 2 }) {
  const { id } = useParams();
  const desktop = useIsDesktop();
  const nav = useNavigate();
  const toast = useToast();
  const mine = useMine();
  const [d, setD] = useState<Dossier | null | undefined>(undefined);
  const [acts, setActs] = useState<Activity[]>([]);
  const [relOpen, setRelOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const [dd, aa] = await Promise.all([api.getDossier(id), api.listActivity(id)]);
    setD(dd);
    setActs(aa);
  }, [id]);
  useEffect(() => {
    setD(undefined);
    void load();
  }, [load]);

  if (d === null) return <Navigate to="/record" replace />;
  if (!d) return <Frame plate="판독" ingame><Loading text="판독지를 라이트박스에 거는 중" /></Frame>;

  const own = d.persona.mine;
  async function talk() {
    const me = mine[0];
    if (!me || !d) return;
    const r = await api.openDm(me.id, d.persona.id);
    if (!r.ok) return toast({ kind: 'danger', text: r.message });
    nav(`/dm/${r.value}`);
  }

  const actions = !own ? (
    <div className="app-dossier-actions">
      <button type="button" className="t-btn t-btn--primary" onClick={() => void talk()}>
        <Px name="speech" />
        말 걸기
      </button>
      <button type="button" className="t-btn t-btn--outline" onClick={() => setRelOpen(true)}>
        관계 신청
      </button>
    </div>
  ) : mine.length > 1 ? (
    <div className="app-dossier-actions app-dossier-actions--one">
      <button type="button" className="t-btn t-btn--outline" onClick={() => setRelOpen(true)}>
        내 다른 캐릭터와 잇기
      </button>
    </div>
  ) : undefined;

  const right = desktop ? (
    <div className="app-side">
      <section aria-labelledby="who-h" className="app-sec">
        <h2 id="who-h" className="t-label">
          {own ? '내 캐릭터' : '이 캐릭터'}
        </h2>
        <div className="app-staying">
          <Face p={d.persona} size={44} />
          <span className="app-staying__text">
            <span style={{ fontWeight: 700 }}>{d.persona.name}</span>
            <span className="t-muted" style={{ fontSize: 12 }}>
              {ROLE_LABEL[d.persona.role]}
              {d.status ? ` · ${d.status}` : ''}
            </span>
          </span>
        </div>
      </section>
      {own && (
        <p className="t-field__help" style={{ margin: 0 }}>
          설정 글과 사진 고치기는 다음 작업 묶음에서 열려요.
        </p>
      )}
    </div>
  ) : undefined;

  return (
    <>
      <Frame
        plate="판독 라이트박스"
        ingame
        flush
        header={<ScreenHeader title={d.persona.name} sub="CH.04 판독지" back={{ to: own ? '/record' : '/directory', label: own ? '기록으로 돌아가기' : '명부로 돌아가기' }} />}
        right={right ? <>{right}{desktop && actions}</> : undefined}
        bar={desktop ? undefined : actions}
        mobileNav={!actions}
        scrollLabel={`${d.persona.name}의 판독지 ${page}쪽`}
      >
        {page === 1 ? (
          <DossierPage1
            d={d}
            own={own}
            onStatsHidden={async (v) => {
              await api.setStatsHidden(d.persona.id, v);
              await load();
              toast({ kind: 'ok', text: v ? '측정치를 다른 사람에게 숨겼어요.' : '측정치를 다시 보이게 했어요.' });
            }}
            onChoiceHidden={async (cid, v) => {
              await api.setChoiceHidden(d.persona.id, cid, v);
              await load();
            }}
          />
        ) : (
          <DossierPage2 d={d} items={acts} />
        )}
      </Frame>
      {relOpen && (
        <RelationSheet
          target={d.persona}
          onClose={() => setRelOpen(false)}
          onDone={() => {
            setRelOpen(false);
            void load();
          }}
        />
      )}
    </>
  );
}

/** CH.04 기록: 내 캐릭터의 판독지, 받은 관계 신청, 캐릭터 명부로 가는 길. */
export function RecordScreen() {
  const mine = useMine();
  const { characters } = useSession();
  const toast = useToast();
  const [reqs, setReqs] = useState<RelationRequest[] | null>(null);
  const load = useCallback(() => void api.listRelationRequests().then(setReqs), []);
  useEffect(load, [load]);

  async function answer(r: RelationRequest, accept: boolean) {
    const res = await api.answerRelationRequest(r.id, accept);
    if (!res.ok) return toast({ kind: 'danger', text: res.message });
    toast({ kind: 'ok', text: accept ? `${josa(r.to.name, '와/과')} ${josa(r.from.name, '이/가')} 이어졌어요.` : '신청을 받지 않았어요. 상대에게는 "받지 않음"으로만 알려져요.' });
    load();
  }

  return (
    <Frame plate="기록" ingame header={<ScreenHeader title="기록" sub="CH.04" />} scrollLabel="기록" deskClass="app-desk--narrow">
      <section aria-labelledby="mine-h2" className="app-sec">
        <h2 id="mine-h2" className="t-label">
          내 캐릭터의 판독지
        </h2>
        <ul className="app-list">
          {mine.map((m) => {
            const c = characters.find((x) => x.id === m.id);
            return (
              <li key={m.id}>
                <Link className="app-card-row" to={`/dossier/${m.id}`}>
                  <Face p={m} size={44} />
                  <span className="app-staying__text">
                    <span style={{ fontWeight: 700 }}>{m.name}</span>
                    <span className="t-muted" style={{ fontSize: 12 }}>
                      {ROLE_LABEL[m.role]}
                      {c?.registrationNo ? ` · 등록 ${c.registrationNo}` : ''}
                    </span>
                  </span>
                  <span className="t-tag">판독지</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
      <section aria-labelledby="req-h" className="app-sec">
        <h2 id="req-h" className="t-label">
          받은 관계 신청 {reqs?.length || ''}
        </h2>
        {reqs === null ? null : reqs.length ? (
          <ul className="app-list">
            {reqs.map((r) => (
              <li key={r.id} className="app-req">
                <div className="app-staying">
                  <Face p={r.from} size={44} />
                  <span className="app-staying__text">
                    <span>
                      <b>{r.from.name}</b>
                      {` → ${r.to.name}`}
                    </span>
                    <span className="t-muted" style={{ fontSize: 12 }}>
                      {REL_LABEL[r.kind]} · {ago(r.at)}
                    </span>
                  </span>
                </div>
                {r.note && <p className="t-reading" style={{ margin: 0, fontSize: 14 }}>{r.note}</p>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="t-btn t-btn--solid" style={{ flexGrow: 1 }} onClick={() => void answer(r, true)}>
                    받아들이기
                  </button>
                  <button type="button" className="t-btn t-btn--outline" onClick={() => void answer(r, false)}>
                    받지 않기
                  </button>
                  <Link className="t-btn t-btn--ghost" to={`/dossier/${r.from.id}`}>
                    판독지<span className="t-sr"> {r.from.name}</span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="t-field__help" style={{ margin: 0 }}>
            받은 신청이 없어요.
          </p>
        )}
      </section>
      <section aria-labelledby="dir-h" className="app-sec">
        <h2 id="dir-h" className="t-label">
          캐릭터 명부
        </h2>
        <Link className="t-btn t-btn--row" to="/directory">
          <span>명부에서 캐릭터 찾기</span>
          <span className="t-btn__count">이름, 역할</span>
        </Link>
      </section>
    </Frame>
  );
}

/** M-19 캐릭터 명부: 이름으로 찾고 역할로 거른다. 능력치나 인기로 줄 세우지 않고, 아직 모르는 사람을 앞에. */
export function DirectoryScreen() {
  const [text, setText] = useState('');
  const [role, setRole] = useState<'all' | Role>('all');
  const [list, setList] = useState<DirectoryEntry[] | null>(null);
  useEffect(() => {
    const t = setTimeout(() => void api.listDirectory({ text, role: role === 'all' ? null : role }).then(setList), 200);
    return () => clearTimeout(t);
  }, [text, role]);
  const roles: ('all' | Role)[] = ['all', 'ability', 'staff', 'free'];
  return (
    <Frame plate="명부" ingame header={<ScreenHeader title="캐릭터 명부" sub="CH.04 기록" back={{ to: '/record', label: '기록으로 돌아가기' }} />} scrollLabel="캐릭터 명부" deskClass="app-desk--narrow">
      <form role="search" aria-label="캐릭터 찾기" onSubmit={(e) => e.preventDefault()}>
        <TextField label="이름으로 찾기" type="search" value={text} onChange={setText} placeholder="[캐릭터 이름]" />
      </form>
      <div role="group" aria-label="역할로 거르기" className="app-roletabs" style={{ display: 'flex', gap: 6 }}>
        {roles.map((r) => (
          <button key={r} type="button" className="t-tab" style={{ flex: 1 }} aria-pressed={role === r} onClick={() => setRole(r)}>
            {r === 'all' ? '전체' : ROLE_LABEL[r]}
          </button>
        ))}
      </div>
      {list === null ? (
        <Loading text="명부를 넘기는 중" />
      ) : list.length ? (
        <ul className="app-list" aria-label={`찾은 캐릭터 ${list.length}명`}>
          {list.map((e) => (
            <li key={e.persona.id}>
              <Link className="app-card-row" to={`/dossier/${e.persona.id}`}>
                <Face p={e.persona} size={44} />
                <span className="app-staying__text">
                  <span>
                    <b>{e.persona.name}</b> {e.persona.mine && <span className="t-muted">(내 캐릭터)</span>}
                  </span>
                  <span className="t-muted" style={{ fontSize: 12 }}>
                    {ROLE_LABEL[e.persona.role]}
                    {e.origin ? ` · ${e.origin} 출신` : ''}
                  </span>
                </span>
                {e.newToMe && <span className="t-tag">처음 만남</span>}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="t-empty" style={{ border: '1px solid var(--line)' }}>
          <p className="t-empty__title">찾는 캐릭터가 없어요</p>
          <p className="t-empty__text">이름 일부만 적어도 찾아요. 역할 거르기를 "전체"로 바꿔 보세요.</p>
        </div>
      )}
    </Frame>
  );
}
