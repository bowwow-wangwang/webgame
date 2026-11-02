import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { BALANCE, TEXT_LIMITS } from '../../config/balance';
import { GAME_TITLE } from '../../config/game';
import { useIsDesktop } from '../../lib/useIsDesktop';
import { useSession } from '../../lib/session';
import { api } from '../../services';
import { Frame, FormBar, ScreenHeader } from '../../shell/Frame';
import { Alloc, initialStats, pointsLeft } from '../../ui/Alloc';
import { SelectField, TextArea, TextField } from '../../ui/Field';
import { Loading } from '../../ui/Loading';
import { PickGroup } from '../../ui/Pick';
import { Steps } from '../../ui/Steps';
import { useToast } from '../../ui/Toast';
import { shrinkImage, Upload } from '../../ui/Upload';
import { MEMORY_LOSS_LABEL, ROLE_LABEL, type CharacterDraft, type MemoryLoss, type Role, type Settlement } from '../../types/domain';
import { Record } from './Record';

const STEP_NAMES = ['역할과 이름', '설정', '능력치', '사진', '확인'] as const;
const NEXT_LABEL = ['다음: 설정 쓰기', '다음: 능력치', '다음: 사진', '다음: 확인', '등록하기'];

function emptyDraft(): CharacterDraft {
  return {
    role: null,
    name: '',
    look: '',
    personality: '',
    past: '',
    ability: '',
    memoryLoss: null,
    originSettlementId: null,
    stats: initialStats(),
    images: [],
    savedAt: null,
  };
}

const ROLE_DESC: Record<Role, string> = {
  ability: '황폐 지역 정화 작업에 출동해요. 정부에 등록되고, 생활은 재단이 돌봐요.',
  staff: '능력자의 오염 관리와 케어를 맡아요. 의료, 상담, 행정, 식당 일도 해요.',
  free: '어디에도 매이지 않은 시민이에요. 도시 생활자부터 여행자까지.',
};

/** M-03 ~ M-07 · P-02 캐릭터 만들기 다섯 단계. 단계마다 임시저장하고, 끝난 단계로 돌아가도 쓴 글은 그대로다. */
export function CreateFlow() {
  const { step: stepParam } = useParams();
  const step = Math.min(5, Math.max(1, Number(stepParam) || 1));
  const nav = useNavigate();
  const desktop = useIsDesktop();
  const toast = useToast();
  const { characters, refresh } = useSession();
  const [draft, setDraft] = useState<CharacterDraft | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    void (async () => {
      const [d, s] = await Promise.all([api.loadDraft(), api.listSettlements()]);
      setDraft(d ?? emptyDraft());
      setSettlements(s);
    })();
  }, []);

  // 쓰기를 멈추고 2초 뒤 임시저장한다 (단계를 넘길 때도 한 번).
  const persist = useCallback(async (d: CharacterDraft) => {
    const at = await api.saveDraft(d);
    setDraft((cur) => (cur ? { ...cur, savedAt: at } : cur));
  }, []);
  const update = useCallback(
    (patch: Partial<CharacterDraft>) => {
      setDraft((cur) => {
        if (!cur) return cur;
        const next = { ...cur, ...patch };
        if (saveTimer.current) window.clearTimeout(saveTimer.current);
        saveTimer.current = window.setTimeout(() => void persist(next), 2000);
        return next;
      });
    },
    [persist],
  );
  useEffect(() => () => void (saveTimer.current && window.clearTimeout(saveTimer.current)), []);
  useEffect(() => setTried(false), [step]);

  if (characters.length >= BALANCE.maxCharactersPerAccount) return <Navigate to="/home" replace />;
  if (!draft) {
    return (
      <Frame plate="캐릭터 등록" scrollLabel="캐릭터 만들기">
        <Loading text="등록 서식을 꺼내는 중" />
      </Frame>
    );
  }

  const d = draft;
  const isAbility = d.role === 'ability';
  const left = pointsLeft(d.stats);
  const problem = stepProblem(step, d, left);

  async function go(to: number) {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    await persist(d);
    nav(`/create/${to}`);
  }

  async function next() {
    setTried(true);
    if (problem) return;
    if (step < 5) return go(step + 1);
    if (busy) return;
    setBusy(true);
    const r = await api.registerCharacter(d);
    setBusy(false);
    if (!r.ok) {
      toast({ kind: 'danger', text: r.message });
      const back = r.field === 'role' || r.field === 'name' ? 1 : r.field === 'memoryLoss' || r.field === 'text' ? 2 : r.field === 'stats' ? 3 : null;
      if (back) nav(`/create/${back}`);
      return;
    }
    await refresh();
    nav(`/registered/${r.value.id}`, { replace: true });
  }

  function addImage(file: File) {
    const id = Math.random().toString(36).slice(2);
    const tmp = URL.createObjectURL(file);
    update({ images: [...d.images, { id, url: tmp, alt: '', status: 'shrinking' }] });
    void shrinkImage(file)
      .then((blob) => {
        URL.revokeObjectURL(tmp);
        if (blob.size > BALANCE.imageMaxBytes) {
          toast({ kind: 'danger', text: '줄여도 파일이 커서 올리지 못했어요. 다른 사진을 골라 주세요.' });
          setDraft((cur) => (cur ? { ...cur, images: cur.images.filter((i) => i.id !== id) } : cur));
          return;
        }
        const url = URL.createObjectURL(blob);
        setDraft((cur) => (cur ? { ...cur, images: cur.images.map((i) => (i.id === id ? { ...i, url, status: 'ready' } : i)) } : cur));
      })
      .catch(() => {
        toast({ kind: 'danger', text: '사진을 읽지 못했어요. 다른 사진을 골라 주세요.' });
        setDraft((cur) => (cur ? { ...cur, images: cur.images.filter((i) => i.id !== id) } : cur));
      });
  }

  function removeImage(id: string) {
    const before = d.images;
    update({ images: before.filter((i) => i.id !== id) });
    toast({ kind: 'ok', text: '사진을 뺐어요.', action: { label: '되살리기', run: () => update({ images: before }) } });
  }

  const origin = settlements.find((s) => s.id === d.originSettlementId)?.name ?? null;
  const record = (
    <Record
      data={{ role: d.role, name: d.name, memoryLoss: d.memoryLoss, origin, stats: d.stats, past: d.past, registrationNo: null }}
      stamped={false}
    />
  );

  const body = (() => {
    switch (step) {
      case 1:
        return (
          <>
            <p className="t-field__help" style={{ margin: 0 }}>
              이 계정의 캐릭터 {characters.length + 1} / {BALANCE.maxCharactersPerAccount}
            </p>
            <PickGroup<Role>
              legend="역할"
              value={d.role}
              onChange={(role) => update({ role })}
              note="역할에 따라 하루에 하는 일과 판독지 서식이 달라져요. 등록한 뒤에는 바꿀 수 없어요."
              options={(['ability', 'staff', 'free'] as Role[]).map((r) => ({ value: r, title: ROLE_LABEL[r], desc: ROLE_DESC[r] }))}
            />
            {tried && !d.role && <p className="t-field__error" role="alert">역할을 골라 주세요.</p>}
            <TextField
              label="이름"
              value={d.name}
              onChange={(name) => update({ name })}
              max={TEXT_LIMITS.name}
              placeholder="[캐릭터 이름]"
              help="판독지와 대화에 이 이름으로 보여요."
              error={tried && !d.name.trim() ? '이름을 적어 주세요.' : [...d.name].length > TEXT_LIMITS.name ? `${TEXT_LIMITS.name}자까지 적을 수 있어요.` : null}
            />
          </>
        );
      case 2:
        return (
          <>
            <p className="t-field__help" style={{ margin: 0 }}>
              모두 빈칸으로 둬도 돼요. 쓰던 글은 자동으로 임시저장되고, 등록한 뒤에도 판독지에서 고칠 수 있어요.
            </p>
            <TextArea label="외형" value={d.look} onChange={(look) => update({ look })} max={TEXT_LIMITS.look} />
            <TextArea label="성격" value={d.personality} onChange={(personality) => update({ personality })} max={TEXT_LIMITS.personality} />
            <TextArea label="과거" value={d.past} onChange={(past) => update({ past })} max={TEXT_LIMITS.past} help='판독지 "본인 진술" 칸에 그대로 실려요. 말소되지 않아요.' rows={5} />
            {isAbility && (
              <>
                <hr className="t-sep" />
                <p className="t-label" style={{ margin: 0 }}>
                  능력자만 쓰는 칸
                </p>
                <TextArea label="능력" value={d.ability} onChange={(ability) => update({ ability })} max={TEXT_LIMITS.ability} help="종류에 제한이 없어요. 이름을 붙여도, 설명만 써도 돼요." />
                <PickGroup<MemoryLoss>
                  legend="기억상실 정도"
                  row
                  value={d.memoryLoss}
                  onChange={(memoryLoss) => update({ memoryLoss })}
                  note='발현할 때 잃은 기억이에요. 판독지 "발현 이전 기록" 칸이 이만큼 말소됨 띠로 가려져요.'
                  options={(Object.keys(MEMORY_LOSS_LABEL) as MemoryLoss[]).map((m) => ({ value: m, title: MEMORY_LOSS_LABEL[m] }))}
                />
                {tried && !d.memoryLoss && <p className="t-field__error" role="alert">기억상실 정도를 골라 주세요.</p>}
              </>
            )}
            <SelectField
              label="출신 정착지"
              optional="고르지 않아도 돼요"
              value={d.originSettlementId ?? ''}
              onChange={(v) => update({ originSettlementId: v || null })}
              options={[{ value: '', label: '고르지 않음' }, ...settlements.map((s) => ({ value: s.id, label: s.name }))]}
            />
          </>
        );
      case 3:
        return (
          <>
            {desktop && (
              <h2 className="t-pixel t-glow" style={{ margin: 0, fontSize: 22 }}>
                능력치 나누기
              </h2>
            )}
            <p className="t-reading" style={{ margin: 0, fontSize: 15 }}>
              모든 능력치는 {BALANCE.statBase}에서 시작해요. 포인트 {BALANCE.statPool}을 나눠 넣고, 한 능력치는 {BALANCE.statCapAtCreation}까지 올릴 수 있어요.
            </p>
            <p className="t-field__help" style={{ margin: 0 }}>
              수치가 곧 성공할 확률이에요. 55면 100번에 55번쯤 성공해요. 등록한 뒤 한 번은 무료로 다시 나눌 수 있어요.
            </p>
            <Alloc stats={d.stats} role={d.role} onChange={(stats) => update({ stats })} columns={1} />
            {tried && left !== 0 && (
              <p className="t-field__error" role="alert">
                {left}포인트가 남았어요. 모두 나눠 주세요.
              </p>
            )}
            <button
              className="t-btn t-btn--ghost"
              type="button"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => {
                const before = d.stats;
                update({ stats: initialStats() });
                toast({ kind: 'ok', text: '모두 30으로 되돌렸어요.', action: { label: '되살리기', run: () => update({ stats: before }) } });
              }}
            >
              모두 30으로 되돌리기
            </button>
          </>
        );
      case 4:
        return (
          <>
            <Upload images={d.images} onAdd={addImage} onRemove={removeImage} />
            {d.images[0] && (
              <TextField
                label="1번 사진 설명"
                value={d.images[0].alt}
                max={TEXT_LIMITS.imageAlt}
                placeholder="[어떤 그림인지 한 줄로]"
                help={`화면 낭독기가 읽어 줘요. 비워 두면 "${d.name || '캐릭터'}의 그림"으로 읽어요.`}
                onChange={(alt) => update({ images: d.images.map((im, i) => (i === 0 ? { ...im, alt } : im)) })}
              />
            )}
            <ul className="t-field__help" style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>올리기 전에 긴 변 {BALANCE.imageLongEdge}px로 줄이고 WebP로 바꿔요. 한 장 {BALANCE.imageMaxBytes / 1000}KB, {BALANCE.imagesPerCharacter}장까지예요.</li>
              <li>전체 이용가 공간이에요. 노출이 있거나 잔혹한 그림은 올릴 수 없어요.</li>
              <li>사진은 나중에 판독지에서 올려도 돼요.</li>
            </ul>
          </>
        );
      default:
        return (
          <>
            <p className="t-reading" style={{ margin: 0, fontSize: 15 }}>
              {isAbility
                ? '이대로 등록할까요? 능력자는 정부에 관리대상자로 등록되고, 생활은 재단이 돌봐요.'
                : '이대로 등록할까요?'}
            </p>
            {!desktop && record}
            <p className="t-field__help" style={{ margin: 0 }}>
              등록한 뒤에도 설정 글과 사진은 판독지에서 고칠 수 있어요. 역할은 바꿀 수 없어요.
            </p>
          </>
        );
    }
  })();

  const subtitle = d.role ? `${d.name || '[이름]'} · ${ROLE_LABEL[d.role]}` : '새 캐릭터';
  const steps = <Steps names={STEP_NAMES} current={step} side={desktop} savedAt={d.savedAt} onGo={(s) => void go(s)} />;
  const leftPane = desktop ? (
    <aside className="t-sidebar" aria-label="만드는 단계">
      <div className="app-brand">
        <span className="t-label">
          {GAME_TITLE} · 이 계정의 {characters.length + 1} / {BALANCE.maxCharactersPerAccount}
        </span>
        <h1 className="t-pixel t-glow" style={{ fontSize: 19, margin: 0 }}>
          캐릭터 만들기
        </h1>
        <span className="t-muted" style={{ fontSize: 13 }}>
          {subtitle}
        </span>
      </div>
      {steps}
      <p className="t-field__help" style={{ padding: '14px var(--space-4)', margin: 0 }}>
        끝난 단계는 눌러서 돌아갈 수 있어요. 쓴 글은 그대로 있어요.
      </p>
    </aside>
  ) : undefined;

  return (
    <Frame
      plate="캐릭터 등록"
      left={leftPane}
      right={
        desktop ? (
          <>
            <h2 className="t-label" style={{ padding: '18px 16px 8px', margin: 0 }}>
              판독지 미리보기 · 고치는 대로 바뀌어요
            </h2>
            {record}
          </>
        ) : undefined
      }
      header={desktop ? undefined : <ScreenHeader title="캐릭터 만들기" sub={subtitle} back={step > 1 ? { to: `/create/${step - 1}`, label: '이전 단계로' } : undefined} />}
      onSubmit={() => void next()}
      bar={<FormBar prev={step > 1 ? '이전' : undefined} onPrev={() => void go(step - 1)} next={busy ? '등록하는 중…' : NEXT_LABEL[step - 1] ?? '다음'} busy={busy} />}
      scrollLabel={`캐릭터 만들기 ${step}단계: ${STEP_NAMES[step - 1]}`}
      keys={step === 3 ? [['[Tab]', '능력치'], ['[←/→]', '낮추기·올리기'], ['[Enter]', '다음']] : [['[Enter]', '다음']]}
    >
      {desktop ? (
        <p className="t-steps__now" style={{ margin: 0 }}>
          <span>
            <b>
              {step} / {STEP_NAMES.length}
            </b>{' '}
            {STEP_NAMES[step - 1]}
          </span>
          {d.savedAt && <span className="t-saved">임시저장됨</span>}
        </p>
      ) : (
        steps
      )}
      {body}
    </Frame>
  );
}

function stepProblem(step: number, d: CharacterDraft, left: number): string | null {
  if (step === 1) {
    if (!d.role) return 'role';
    if (!d.name.trim() || [...d.name].length > TEXT_LIMITS.name) return 'name';
  }
  if (step === 2 && d.role === 'ability' && !d.memoryLoss) return 'memoryLoss';
  if (step === 3 && left !== 0) return 'stats';
  return null;
}
