# [게임 제목]

좀비 사태 이후 휴전 5년차를 배경으로 한 자캐 커뮤니티 웹게임. 작업 지침은 `CLAUDE.md`, 설계는 `docs/`에 있다.

## 실행

```bash
npm install
npm run dev        # http://localhost:5173 (개발 서버)
npm run build      # 스타일 생성 → 타입 검사 → dist/
npm run preview    # http://localhost:4173/webgame/ (깃허브 페이지와 같은 하위 경로)
```

지금은 서버 없이 **가짜 데이터 서비스**(`src/services/mock.ts`)로 돈다. 브라우저 탭을 닫으면 지워진다.
- 초대 코드: 8글자면 아무거나 된다 (예: `K7Q2-M9XA`). 한 번 쓴 코드는 다시 못 쓴다.
- 처음 온 사람 흐름: 로그인 → 초대 코드로 가입 → 캐릭터 만들기 5단계 → 등록 끝 → 홈 화면에 두기 → 첫 보내두기 → 장소 채널.

## 구조

| 위치 | 무엇 |
| --- | --- |
| `design/` | 디자인 시스템 원본: `tokens.json`, `system.css.tpl`, `build-css.mjs` |
| `src/styles/system.css` | 위 원본에서 만들어진 파일. 손으로 고치지 않는다 (`npm run css`) |
| `src/styles/app.css` | 화면 배치. 폭 기준: 600px 미만 휴대폰, 600~959px 태블릿(모바일 배치를 가운데 640px로 모음), 960~1279px 작은 노트북(PC 배치, 양옆 칸을 좁힘), 1280px부터 PC |
| `src/config/` | 게임 제목(미정), 밸런스 수치(`world_config`와 같아야 함), 배치 기준 폭 |
| `src/types/domain.ts` | 화면이 주고받는 데이터의 모양 |
| `src/services/` | 데이터 창구. 지금은 `mock.ts`, 다음에 Supabase 구현으로 바꾼다 |
| `src/ui/` | 디자인 시스템 부품을 감싼 React 부품 |
| `src/shell/Frame.tsx` | 모든 화면의 틀. 폭에 따라 모바일 / PC 배치 |
| `src/screens/` | 화면 |

## 배포

깃허브 페이지(저장소 이름 `webgame`이 하위 경로). 해시 주소(`#/home`)를 써서 새로고침해도 깨지지 않는다. 배포 설정은 아직 없다.

## 글꼴과 그림

- 갈무리11: OFL (`src/assets/fonts/OFL-galmuri.md`)
- Nanum Gothic Coding, Noto Sans KR: Google Fonts (OFL)
- 질감과 소품 이미지, 픽셀 아이콘: 이 프로젝트에서 직접 만든 것
