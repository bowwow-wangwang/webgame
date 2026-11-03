import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { clockKST, dateKST } from '../../lib/time';
import {
  MEMORY_LOSS_LABEL,
  REL_LABEL,
  ROLE_LABEL,
  STAT_ORDER,
  statLabel,
  type Activity,
  type ActivityKind,
  type Dossier,
  type DossierPart,
  type Role,
  PRE_RECORD_ITEMS,
  redactedCount,
} from '../../types/domain';
import { GovEmblem } from '../../ui/Marks';

// 역할마다 다른 서식. 재단 직원과 무소속 서식의 세부(문장, 도장)는 아직 정해지지 않았다.
const FORM: Record<Role, { title: string; sub: (name: string) => string; tabs: [string, string]; no: (d: Dossier) => string | null }> = {
  ability: { title: '특이반응자 관찰 기록', sub: () => '관리대상자 등록 기록, 오르덴 공화국 발행', tabs: ['기록카드', '활동 기록'], no: (d) => (d.registrationNo ? `등록 ${d.registrationNo}` : null) },
  staff: { title: '재단 직원 인사 카드', sub: () => '인사 기록, 아킬레아 재단 발행', tabs: ['인사 카드', '근무 기록'], no: () => null },
  free: { title: '여행 일지', sub: (n) => `${n}의 여행 기록`, tabs: ['여행 일지', '다녀온 길'], no: () => null },
};

export const PAGE_NAMES = (role: Role) => FORM[role].tabs;

function Desk({ children, mark }: { children: ReactNode; mark: string }) {
  return (
    <div className="t-desk app-desk-paper" data-theme="film">
      <div className="t-filmedge" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={`a${i}`} className="t-filmedge__hole" />
        ))}
        <span className="t-filmedge__mark">{mark}</span>
        {Array.from({ length: 24 }, (_, i) => (
          <span key={`b${i}`} className="t-filmedge__hole" />
        ))}
      </div>
      <div className="app-paper-col">{children}</div>
    </div>
  );
}

function Head({ d, page }: { d: Dossier; page: 1 | 2 }) {
  const f = FORM[d.persona.role];
  const no = f.no(d);
  const { month } = dateKST();
  return (
    <>
      <nav className="t-dossier__tabs" aria-label="판독지 쪽">
        <Link to={`/dossier/${d.persona.id}`} aria-current={page === 1 ? 'page' : undefined}>
          <b>1</b>
          {f.tabs[0]}
        </Link>
        <Link to={`/dossier/${d.persona.id}/log`} aria-current={page === 2 ? 'page' : undefined}>
          <b>2</b>
          {f.tabs[1]}
        </Link>
      </nav>
      <header className="t-dossier__head">
        {d.persona.role === 'ability' && <GovEmblem />}
        <div className="t-dossier__org">
          <b id="dos-h">{f.title}</b>
          <span className="t-muted" style={{ fontSize: 12 }}>
            {f.sub(d.persona.name)}
          </span>
        </div>
      </header>
      <p className="t-dossier__no">
        {no && <span>{no}</span>}
        <span>쪽 {page}/2</span>
        {page === 2 && <span>휴전 5년 {month}월</span>}
      </p>
    </>
  );
}

function Bar({ children, first }: { children: ReactNode; first?: boolean }) {
  return (
    <h2 className="t-bar" style={first ? undefined : { marginTop: 14 }}>
      {children}
    </h2>
  );
}

function Block({ children }: { children: ReactNode }) {
  return <div className="app-paper-block">{children}</div>;
}

/** 판독지 1쪽: 기록카드 / 인사 카드 / 여행 일지. 장식(도장, 말소 띠)은 글자를 가리지 않게 여백에만. */
/** 운영자가 가린 칸: 남에게는 가렸다는 말만, 주인에게는 글과 함께 "나에게만 보여요". */
function Veiled({ d, own, part, text }: { d: Dossier; own: boolean; part: DossierPart; text: string }) {
  if (!d.veiled.includes(part)) return <>{text || '기재 사항 없음'}</>;
  if (!own || !text) return <span className="app-veiled">운영자가 가린 내용이에요.</span>;
  return (
    <>
      {text}
      <span className="app-veiled app-veiled--own">운영자가 숨긴 칸이에요. 나에게만 보여요.</span>
    </>
  );
}

export function DossierPage1({
  d,
  own,
  onStatsHidden,
  onChoiceHidden,
}: {
  d: Dossier;
  own: boolean;
  onStatsHidden: (v: boolean) => void;
  onChoiceHidden: (id: string, v: boolean) => void;
}) {
  const role = d.persona.role;
  const ability = role === 'ability';
  const redacted = redactedCount(d.memoryLoss);
  const c = d.contamination;
  const avg = c ? Math.round(c.reduce((a, b) => a + b, 0) / c.length) : 0;
  const max = c ? Math.max(...c) : 0;
  const now = c?.at(-1) ?? 0;

  return (
    <Desk mark={`${d.registrationNo ?? d.persona.name} 5Y 판독`}>
      <article className="t-dossier" aria-labelledby="dos-h">
        <Head d={d} page={1} />
        <div style={{ position: 'relative' }}>
          <Bar first>인적 사항</Bar>
          <div className="t-cells app-cells-beside">
            <div className="t-cell">
              <span className="t-cell__k">성명</span>
              <span className="t-cell__v" style={{ fontWeight: 700 }}>
                {d.persona.name}
              </span>
            </div>
            <div className="t-cell">
              <span className="t-cell__k">분류</span>
              <span className="t-cell__v">{ROLE_LABEL[role]}</span>
            </div>
            <div className="t-cell">
              <span className="t-cell__k">출신</span>
              <span className="t-cell__v">{d.origin?.name ?? '기재 사항 없음'}</span>
            </div>
            {ability && (
              <div className="t-cell">
                <span className="t-cell__k">기억</span>
                <span className="t-cell__v">{d.memoryLoss ? MEMORY_LOSS_LABEL[d.memoryLoss] : '기재 사항 없음'}</span>
              </div>
            )}
          </div>
          <figure className="t-mug app-mug">
            <span className="t-dossier__clip" aria-hidden="true" />
            <div className="t-mug__photo">
              {d.persona.portraitUrl ? (
                <img src={d.persona.portraitUrl} alt={`${d.persona.name}의 그림`} />
              ) : (
                <span className="app-mug__empty">{d.veiled.includes('image') ? '운영자가 가린 사진' : '사진 없음'}</span>
              )}
            </div>
            <figcaption className="t-mug__plate">{d.registrationNo ?? ROLE_LABEL[role]}</figcaption>
          </figure>
          <div className="t-cells" style={{ borderTop: 'none' }}>
            {ability && (
              <div className="t-cell t-cell--wide">
                <span className="t-cell__k">능력</span>
                <span className="t-cell__v">
                  <Veiled d={d} own={own} part="ability" text={d.ability} />
                </span>
              </div>
            )}
            <div className="t-cell t-cell--wide">
              <span className="t-cell__k">상태</span>
              <span className="t-cell__v">{d.status ? <span className="t-status t-status--info">{d.status}</span> : <span className="t-status t-status--idle">보내 둔 일 없음</span>}</span>
            </div>
          </div>
        </div>

        <Bar>측정치</Bar>
        {d.stats ? (
          <div className="t-cells">
            {STAT_ORDER.map((k) => (
              <div className="t-cell" key={k}>
                <span className="t-cell__k">{statLabel(k, role)}</span>
                <span className="t-cell__v app-statv">
                  <span className="t-pixel" style={{ width: 22 }}>
                    {d.stats?.[k]}
                  </span>
                  <span aria-hidden="true" className="app-statbar">
                    <span style={{ width: `${d.stats?.[k] ?? 0}%` }} />
                  </span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Block>
            <span className="t-stamp t-stamp--sm">비공개</span>
            <span className="t-muted" style={{ fontSize: 13, marginLeft: 10 }}>
              주인이 숫자를 숨겼어요.
            </span>
          </Block>
        )}
        {own && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
            <button type="button" className="t-btn t-btn--outline" aria-pressed={d.statsHidden} onClick={() => onStatsHidden(!d.statsHidden)}>
              {d.statsHidden ? '숫자 보이기 (지금 숨김)' : '다른 사람에게 숫자 숨기기'}
            </button>
          </div>
        )}

        <Bar>관찰 사항</Bar>
        <ol className="t-numlist">
          {ability && (
            <li>
              <span>
                접종 뒤 발현. 발현 이전 기록 {PRE_RECORD_ITEMS.length}개 항목 중 {redacted}개 말소됨.
              </span>
            </li>
          )}
          {c && (
            <li>
              <span>
                최근 7일 오염 평균 {avg}, 최고 {max}. 지금 {now}.
                <span role="img" aria-label={`최근 7일 오염 ${c.join(', ')}`} className="app-contam">
                  {c.map((v, i) => (
                    <span key={i} style={{ height: `${Math.max(v, 2)}%`, background: i === c.length - 1 ? 'var(--ink)' : 'var(--ink-muted)' }} />
                  ))}
                </span>
              </span>
            </li>
          )}
          {d.choices.map((l) => (
            <li key={l.id}>
              <span className="app-choice">
                <span style={own && l.hidden ? { opacity: 0.6 } : undefined}>
                  {l.date} {l.text}
                  {own && l.hidden && ' (숨김)'}
                </span>
                {own && (
                  <button type="button" className="t-btn t-btn--ghost" onClick={() => onChoiceHidden(l.id, !l.hidden)}>
                    {l.hidden ? '보이기' : '숨기기'}
                  </button>
                )}
              </span>
            </li>
          ))}
          {!d.choices.length && (
            <li>
              <span className="t-muted">선택 기록이 아직 없어요. 갈림길에서 고른 것이 한 줄씩 남아요.</span>
            </li>
          )}
        </ol>

        {ability && (
          <>
            <Bar>발현 이전 기록</Bar>
            <div className="t-cells">
              {PRE_RECORD_ITEMS.map((it, i) => (
                <div className="t-cell" key={it.key}>
                  <span className="t-cell__k">{it.label}</span>
                  <span className="t-cell__v">
                    {i >= PRE_RECORD_ITEMS.length - redacted ? <span className="t-redact">말소됨</span> : d.preRecord[it.key] || '기재 사항 없음'}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        <Bar>본인 진술</Bar>
        <p className="t-reading app-statement">
          <Veiled d={d} own={own} part="past" text={d.past} />
        </p>
        {(d.look || d.personality || d.veiled.includes('look') || d.veiled.includes('personality')) && (
          <>
            <Bar>외형과 성격</Bar>
            <div className="t-cells">
              <div className="t-cell t-cell--wide">
                <span className="t-cell__k">외형</span>
                <span className="t-cell__v app-pre">
                  <Veiled d={d} own={own} part="look" text={d.look} />
                </span>
              </div>
              <div className="t-cell t-cell--wide">
                <span className="t-cell__k">성격</span>
                <span className="t-cell__v app-pre">
                  <Veiled d={d} own={own} part="personality" text={d.personality} />
                </span>
              </div>
            </div>
          </>
        )}

        {d.memo && (
          <div className="t-memo">
            <p className="t-label" style={{ color: 'var(--foundation)' }}>
              {d.memo.by}의 재단 메모
            </p>
            <p className="t-reading" style={{ margin: '6px 0 0', fontSize: 14 }}>
              {d.memo.text}
            </p>
          </div>
        )}

        <Bar>문답</Bar>
        {d.qna.length ? (
          <ol className="t-numlist">
            {d.qna.map((q) => (
              <li key={q.id}>
                <span>
                  <span className="t-muted" style={{ display: 'block', fontSize: 13 }}>
                    {q.question}
                  </span>
                  {q.answer}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <Block>
            <span className="t-muted" style={{ fontSize: 13 }}>
              아직 남긴 답이 없어요.
            </span>
          </Block>
        )}

        <Bar>소지품과 받은 물건</Bar>
        <div className="t-empty t-empty--form" style={{ borderTop: 'none' }}>
          <span className="t-stamp t-stamp--sm">기재 사항 없음</span>
          <p className="t-empty__text">물품을 받고 건네는 일은 다음 단계(v0.2)에서 열려요. 받은 수는 세지 않아요.</p>
        </div>

        <Bar>참고인과 관계</Bar>
        {d.relations.length ? (
          <ul className="app-relgrid">
            {d.relations.map((r) => (
              <li key={r.id}>
                <Link className={r.kind === 'lost' ? 't-relcard t-relcard--lost' : 't-relcard'} to={`/dossier/${r.other.id}`}>
                  <span className="t-relcard__label">
                    <small>{r.kind === 'free' ? r.note || REL_LABEL.free : REL_LABEL[r.kind]}</small>
                    <b>{r.other.name}</b>
                  </span>
                  {r.other.portraitUrl ? <img className="t-relcard__photo" src={r.other.portraitUrl} alt="" /> : <span className="t-relcard__photo app-relcard__nophoto" aria-hidden="true" />}
                  {r.kind !== 'free' && r.note && <span className="t-relcard__note">{r.note}</span>}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="t-empty t-empty--form" style={{ borderTop: 'none' }}>
            <span className="t-stamp t-stamp--sm">기재 사항 없음</span>
            <p className="t-empty__text">아직 이어진 관계가 없어요. 대화하다 마음이 맞으면 관계를 신청할 수 있어요.</p>
          </div>
        )}
        <p className="t-muted" style={{ margin: '6px 0 0', fontSize: 12 }}>
          관계는 양쪽 주인이 동의해야 이어져요. 이름을 누르면 그 캐릭터의 판독지로 가요.
        </p>

        <div className="t-dossier__pager">
          <Link className="t-btn t-btn--outline" to={`/dossier/${d.persona.id}/log`}>
            {FORM[role].tabs[1]} 보기
          </Link>
        </div>
        <footer className="t-dossier__foot">
          <span>
            서식 제[번호]호
            <br />
            개정 휴전 3년차
          </span>
          <span>{d.registrationNo ?? ''}</span>
        </footer>
      </article>
    </Desk>
  );
}

const SLIP_CLASS: Record<ActivityKind, string> = {
  dispatch: 't-slip t-slip--gov',
  shift: 't-slip t-slip--foundation',
  outing: 't-slip t-slip--copy',
  rest: 't-slip t-slip--foundation',
  choice: 't-slip t-slip--memo',
  register: 't-slip t-slip--copy',
};
const NODE_CLASS: Record<ActivityKind, string> = {
  dispatch: 't-timeline__node t-timeline__node--dispatch',
  shift: 't-timeline__node t-timeline__node--work',
  outing: 't-timeline__node t-timeline__node--trip',
  rest: 't-timeline__node t-timeline__node--rest',
  choice: 't-timeline__node t-timeline__node--choice',
  register: 't-timeline__node',
};

type Filter = 'all' | 'send' | 'choice';

/** 판독지 2쪽: 활동 기록 / 근무 기록 / 다녀온 길. 내 기록만 보이고 다른 캐릭터와 비교하지 않는다. */
export function DossierPage2({ d, items }: { d: Dossier; items: Activity[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const role = d.persona.role;
  const sendLabel = role === 'ability' ? '출동' : role === 'staff' ? '근무' : '다녀오기';
  const counts = {
    send: items.filter((i) => ['dispatch', 'shift', 'outing', 'rest'].includes(i.kind)).length,
    choice: items.filter((i) => i.kind === 'choice').length,
  };
  const shown = items.filter((i) => filter === 'all' || (filter === 'send' ? ['dispatch', 'shift', 'outing', 'rest'].includes(i.kind) : i.kind === 'choice'));
  const days = useMemo(() => {
    const out: { day: string; list: Activity[] }[] = [];
    for (const a of shown) {
      const { month, day } = dateKST(new Date(a.at));
      const key = `${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`;
      const last = out.at(-1);
      if (last && last.day === key) last.list.push(a);
      else out.push({ day: key, list: [a] });
    }
    return out;
  }, [shown]);

  return (
    <Desk mark={`${d.registrationNo ?? d.persona.name} 5Y 판독`}>
      <article className="t-dossier" aria-labelledby="dos-h">
        <Head d={d} page={2} />
        <Bar first>이번 달 {role === 'staff' ? '근무' : role === 'free' ? '다녀온 길' : '활동'}</Bar>
        <div className="t-cells" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="t-cell">
            <span className="t-cell__k">{sendLabel}</span>
            <span className="t-cell__v t-pixel" style={{ fontSize: 20 }}>
              {counts.send}
            </span>
          </div>
          <div className="t-cell">
            <span className="t-cell__k">갈림길</span>
            <span className="t-cell__v t-pixel" style={{ fontSize: 20 }}>
              {counts.choice}
            </span>
          </div>
        </div>
        <p className="t-muted" style={{ margin: '6px 0 0', fontSize: 12 }}>
          내 기록만 보여요. 다른 캐릭터와 비교하지 않아요.
        </p>
        <Bar>{FORM[role].tabs[1]}</Bar>
        <div className="t-flags" role="group" aria-label="기록 갈래 고르기">
          {(
            [
              ['all', '전체', 't-flag'],
              ['send', sendLabel, role === 'ability' ? 't-flag t-flag--gov' : 't-flag t-flag--foundation'],
              ['choice', '선택', 't-flag t-flag--memo'],
            ] as [Filter, string, string][]
          ).map(([k, label, cls]) => (
            <button key={k} type="button" className={cls} aria-pressed={filter === k} onClick={() => setFilter(k)}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ padding: '14px 8px 12px', border: '1px solid var(--line-strong)' }}>
          {days.length ? (
            <ol className="t-timeline" aria-label="기록, 최근 것부터">
              {days.flatMap((g) => [
                <li key={`d-${g.day}`} className="t-timeline__day">
                  {g.day}
                </li>,
                ...g.list.map((a) => (
                  <li key={a.id} className="t-timeline__item">
                    <span className="t-timeline__time">{clockKST(a.at)}</span>
                    <span className={NODE_CLASS[a.kind]} aria-hidden="true" />
                    <div className="t-timeline__body">
                      <article className={SLIP_CLASS[a.kind]}>
                        <header className="t-slip__head">
                          <span className="t-slip__title">{a.title}</span>
                          <span className="t-slip__when">
                            <small>일시</small>
                            {g.day} {clockKST(a.at)}
                          </span>
                        </header>
                        {a.rows.map(([k, v]) => (
                          <div className="t-slip__row" key={k}>
                            <span className="t-slip__k">{k}</span>
                            <span className="t-slip__v">{v}</span>
                          </div>
                        ))}
                        {a.body && <p className="t-slip__body">{a.body}</p>}
                        {a.meta.length > 0 && (
                          <p className="t-slip__meta" style={{ margin: 0 }}>
                            {a.meta.map((m) => (
                              <span key={m}>{m}</span>
                            ))}
                          </p>
                        )}
                        {a.form && (
                          <p className="t-slip__form" style={{ margin: 0 }}>
                            <span>{a.form}</span>
                          </p>
                        )}
                      </article>
                    </div>
                  </li>
                )),
              ])}
            </ol>
          ) : (
            <p className="t-muted" style={{ margin: 0, fontSize: 13 }}>
              이 갈래에는 아직 기록이 없어요.
            </p>
          )}
        </div>
        <div className="t-dossier__pager">
          <Link className="t-btn t-btn--outline" to={`/dossier/${d.persona.id}`}>
            {FORM[role].tabs[0]}로 돌아가기
          </Link>
        </div>
        <footer className="t-dossier__foot">
          <span>
            서식 제[번호]호의 2
            <br />
            개정 휴전 3년차
          </span>
          <span>{d.registrationNo ? `${d.registrationNo}-2` : ''}</span>
        </footer>
      </article>
    </Desk>
  );
}
