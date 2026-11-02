/** 불러오는 중. 무엇을 불러오는지 세계관 톤으로 한 줄. */
export function Loading({ text = '재단 기록을 불러오는 중' }: { text?: string }) {
  return (
    <div className="t-loading" aria-busy="true" style={{ padding: 16 }}>
      <p className="t-loading__text" role="status">
        {text}
      </p>
      {[0, 1, 2].map((i) => (
        <div className="t-skel" aria-hidden="true" key={i}>
          <span className="t-skel__face" />
          <span className="t-skel__lines">
            <i />
            <i />
          </span>
        </div>
      ))}
    </div>
  );
}
