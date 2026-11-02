import { STAT_ORDER, MEMORY_LOSS_LABEL, ROLE_LABEL, statLabel, type Role, type Stats } from '../../types/domain';
import { GovEmblem, GovStamp } from '../../ui/Marks';

// 역할마다 다른 서식 이름. 재단 직원·무소속 서식의 세부(문장, 도장)는 아직 정해지지 않았다.
const FORM_TITLE: Record<Role, { org: string | null; title: string }> = {
  ability: { org: '오르덴 공화국', title: '관리대상자 등록 기록' },
  staff: { org: '아킬레아 재단', title: '재단 직원 인사 카드' },
  free: { org: null, title: '여행 일지' },
};

export interface RecordData {
  role: Role | null;
  name: string;
  memoryLoss: string | null;
  origin: string | null;
  stats: Stats;
  past: string;
  registrationNo: string | null;
}

/** 판독지 미리보기 (밝은 종이). 만드는 동안은 "초안", 등록하면 등록 번호와 직인이 붙는다. */
export function Record({ data, stamped, compact }: { data: RecordData; stamped: boolean; compact?: boolean }) {
  const role = data.role ?? 'ability';
  const f = FORM_TITLE[role];
  return (
    <div data-theme="film" className="t-desk" style={{ padding: 12 }}>
      <article className="t-dossier" aria-label={stamped ? f.title : `${f.title} 초안`} style={{ paddingLeft: 14 }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: stamped && role === 'ability' ? 88 : 56 }}>
          {role === 'ability' && <GovEmblem />}
          <span style={{ display: 'flex', flexDirection: 'column' }}>
            {f.org && <b style={{ fontSize: 14 }}>{f.org}</b>}
            <span className="t-label">{f.title}</span>
          </span>
        </header>
        <p className="t-dossier__no" style={{ margin: '8px 0' }}>
          <span>{role === 'ability' ? (data.registrationNo ? `등록 ${data.registrationNo}` : '등록 번호 [등록하면 붙어요]') : '번호 없음'}</span>
        </p>
        {stamped && role === 'ability' ? (
          <span style={{ position: 'absolute', right: 8, top: 6, width: 80 }}>
            <GovStamp bottom="관리 등록" />
          </span>
        ) : (
          !stamped && (
            <span className="t-stamp t-stamp--sm" style={{ position: 'absolute', right: 10, top: 12 }}>
              초안
            </span>
          )
        )}
        <h2 className="t-bar">인적 사항</h2>
        <div className="t-cells">
          <div className="t-cell">
            <span className="t-cell__k">성명</span>
            <span className="t-cell__v" style={{ fontWeight: 700 }}>
              {data.name || '[이름]'}
            </span>
          </div>
          <div className="t-cell">
            <span className="t-cell__k">분류</span>
            <span className="t-cell__v">{data.role ? ROLE_LABEL[data.role] : '[역할]'}</span>
          </div>
          {role === 'ability' && (
            <div className="t-cell t-cell--wide">
              <span className="t-cell__k">기억</span>
              <span className="t-cell__v">{data.memoryLoss ? MEMORY_LOSS_LABEL[data.memoryLoss as keyof typeof MEMORY_LOSS_LABEL] : '[기억상실 정도]'}</span>
            </div>
          )}
          <div className="t-cell t-cell--wide">
            <span className="t-cell__k">출신</span>
            <span className="t-cell__v">{data.origin ?? '기재 사항 없음'}</span>
          </div>
        </div>
        <h2 className="t-bar" style={{ marginTop: 10 }}>
          측정치
        </h2>
        <div className="t-cells" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {STAT_ORDER.map((k) => (
            <div className="t-cell" key={k}>
              <span className="t-cell__k">{statLabel(k, data.role ?? undefined)}</span>
              <span className="t-cell__v" style={{ fontWeight: 700 }}>
                {data.stats[k]}
              </span>
            </div>
          ))}
        </div>
        {!compact && (
          <>
            <h2 className="t-bar" style={{ marginTop: 10 }}>
              본인 진술
            </h2>
            <p className="t-reading app-statement">{data.past || '기재 사항 없음'}</p>
          </>
        )}
      </article>
    </div>
  );
}
