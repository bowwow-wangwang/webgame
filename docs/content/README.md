# docs/content

설정집(Claude Docs)의 콘텐츠 탭을 Markdown으로 내보내 두는 곳이다. 시드 데이터(물품, 꾸미기 조합, 정착지 단계, 출동 문구, 탐색 지점, 갈림길, 문답, 장소 사건, 판정표)의 원본이다.

- `콘텐츠 초안.md` ← 설정집 "콘텐츠 초안" 탭
- `이벤트 스크립트.md` ← 설정집 "이벤트 스크립트" 탭

**"비밀 설정" 탭은 절대 여기에 두지 않는다.** 저장소는 공개된다.

설정집에서 내용을 고치면 다시 내보내 덮어쓰고, Claude Code에게 "docs/content가 바뀌었으니 시드를 맞춰 줘"라고 말한다.

갈림길 시드는 `npm run seed:forks`(scripts/gen-forks.mjs)가 `이벤트 스크립트.md`에서 `src/services/seed/forks.generated.ts`로 만든다. v0.1에서는 F13·F16(모두의 선택), C11·T20(닫아 둔 자유 입력), T09(아직 없는 기능이 조건)를 뺀다.
