// 만들어진 파일: scripts/gen-forks.mjs가 docs/content/이벤트 스크립트.md에서 만든다. 손으로 고치지 않는다.
import type { ForkSeed } from './forks';

export const FORKS: ForkSeed[] = [
  {
    "code": "N01",
    "title": "무전 속 구조 요청",
    "roles": [
      "ability"
    ],
    "gov": true,
    "situation": "출동 중 무전 주파수에 낯선 구조 요청이 섞여 들어온다. 정부 지시는 \"임무 외 행동 금지\"다.",
    "options": [
      {
        "id": "A",
        "label": "신호를 따라간다",
        "record": "명령보다 구조 요청을 따랐다",
        "paper": {
          "from": "gov",
          "text": "임무 이탈 경위서 제출 요망"
        },
        "result": "고립된 정착지 주민 둘을 찾아 정착지까지 데려다주었다. 정화 기여는 조금 줄었다.",
        "stat": "craft",
        "extreme": "주민이 정착지에서 고맙다는 편지를 보낸다"
      },
      {
        "id": "B",
        "label": "위치를 재단에 넘긴다",
        "record": "구조 요청을 재단에 넘겼다",
        "result": "재단 구호팀이 대신 갔다는 회신이 왔다."
      },
      {
        "id": "C",
        "label": "임무에 집중한다",
        "auto": true,
        "result": "예정대로 정화를 마쳤다."
      }
    ]
  },
  {
    "code": "N02",
    "title": "무너진 집의 사진",
    "roles": [
      "ability"
    ],
    "gov": false,
    "situation": "무너진 집 안에 액자가 떨어져 있다. 모르는 사람들이 웃고 있다.",
    "options": [
      {
        "id": "A",
        "label": "챙긴다",
        "record": "낯선 집의 사진을 챙겼다",
        "item": "주인 모를 사진",
        "result": "기념품 \"주인 모를 사진\"을 얻었다."
      },
      {
        "id": "B",
        "label": "제자리에 세워 둔다",
        "auto": true,
        "record": "사진을 그 자리에 세워 두었다",
        "result": "액자를 세워 두고 나왔다."
      }
    ]
  },
  {
    "code": "N03",
    "title": "오염 경보",
    "roles": [
      "ability"
    ],
    "gov": false,
    "situation": "계측기가 경고음을 낸다. 조금만 더 있으면 구역 하나를 끝낼 수 있다.",
    "options": [
      {
        "id": "A",
        "label": "조금 더 버틴다",
        "contamination": 6,
        "result": "정화 기여가 늘었다. 오염도 그만큼 더 쌓였다.",
        "stat": "con",
        "extreme": "오염이 더 쌓이지 않는다",
        "fail": "오래 버티지 못하고 물러났다. 더 버틴 만큼의 기여는 남았다.",
        "failRecord": "경보 속에서 버티려 했다"
      },
      {
        "id": "B",
        "label": "철수한다",
        "auto": true,
        "result": "무리하지 않고 돌아왔다."
      }
    ]
  },
  {
    "code": "N04",
    "title": "따라붙는 드론",
    "roles": [
      "ability"
    ],
    "gov": true,
    "situation": "정부 감시 드론이 따라붙어 능력 사용을 기록하기 시작한다.",
    "options": [
      {
        "id": "A",
        "label": "신경 쓰지 않는다",
        "auto": true,
        "result": "평소처럼 일을 마쳤다."
      },
      {
        "id": "B",
        "label": "능력을 덜 쓴다",
        "record": "감시 아래서 능력을 아꼈다",
        "contamination": -3,
        "result": "오염은 덜 쌓였고 기여도 조금 줄었다.",
        "stat": "craft",
        "extreme": "기여가 줄지 않는다",
        "fail": "능력을 아끼다 보니 일이 더뎠다. 오염은 덜 쌓였다.",
        "failRecord": "감시 아래서 능력을 아꼈다"
      },
      {
        "id": "C",
        "label": "시야 밖으로 돈다",
        "record": "감시 드론을 따돌렸다",
        "paper": {
          "from": "gov",
          "text": "관측 공백 발생 보고"
        },
        "result": "드론을 따돌렸다.",
        "stat": "dex",
        "extreme": "정부 공문이 오지 않는다",
        "fail": "드론은 끝까지 따라왔다. 별일은 없었다.",
        "failRecord": "감시 드론을 따돌리려 했다",
        "failPaper": null
      }
    ]
  },
  {
    "code": "N05",
    "title": "따라오는 개",
    "roles": [
      "ability"
    ],
    "gov": false,
    "situation": "폐허에서 마른 개 한 마리가 계속 따라온다.",
    "options": [
      {
        "id": "A",
        "label": "재단까지 데려간다",
        "record": "떠돌이 개를 재단에 데려왔다",
        "result": "다음 날부터 기숙사 앞에 개가 산다는 소문이 휴게실 채널에 돈다.",
        "stat": "emp",
        "extreme": "개에게 이름을 붙일 수 있다 (휴게실 사건에 이름이 나온다)"
      },
      {
        "id": "B",
        "label": "정착지에 맡긴다",
        "result": "가까운 정착지 사람이 맡아 주었다."
      },
      {
        "id": "C",
        "label": "먹을 것을 나눠 주고 보낸다",
        "auto": true,
        "result": "개는 한참 뒤를 돌아보다 떠났다."
      }
    ]
  },
  {
    "code": "N06",
    "title": "엇갈린 표식",
    "roles": [
      "ability"
    ],
    "gov": false,
    "situation": "먼저 다녀간 사람들의 표식이 두 갈래로 엇갈려 있다.",
    "options": [
      {
        "id": "A",
        "label": "왼쪽 표식을 따른다",
        "auto": true,
        "result": "어느 쪽이든 길은 이어졌다. 고른 표식의 주인에게 \"도움이 됐다\"가 간다."
      },
      {
        "id": "B",
        "label": "오른쪽 표식을 따른다",
        "result": "어느 쪽이든 길은 이어졌다. 고른 표식의 주인에게 \"도움이 됐다\"가 간다."
      },
      {
        "id": "C",
        "label": "새 표식을 남긴다",
        "result": "익명 표식 쓰기가 열린다."
      }
    ]
  },
  {
    "code": "N07",
    "title": "투항",
    "roles": [
      "ability"
    ],
    "gov": true,
    "situation": "잔존 무장 세력 한 사람이 무기를 내려놓고 손을 든다. 다쳐서 오래 걷지 못한다.",
    "options": [
      {
        "id": "A",
        "label": "정부에 인계한다",
        "auto": true,
        "result": "규정대로 인계했다."
      },
      {
        "id": "B",
        "label": "재단 의료동으로 먼저 데려간다",
        "record": "투항자를 의료동에 먼저 데려갔다",
        "paper": {
          "from": "gov",
          "text": "인계 지연 경고"
        },
        "result": "치료를 받은 뒤 인계되었다.",
        "stat": "str",
        "extreme": "정부 공문 대신 재단 메모만 남는다",
        "fail": "부축하느라 한참 걸렸지만 데려갔다."
      },
      {
        "id": "C",
        "label": "가까운 정착지에 데려다준다",
        "record": "투항자를 정착지에 데려다주었다",
        "result": "그 사람의 행방은 기록되지 않았다.",
        "stat": "emp",
        "extreme": "정착지 이야기 조각 하나"
      }
    ]
  },
  {
    "code": "N08",
    "title": "폐허의 라디오",
    "roles": [
      "ability"
    ],
    "gov": false,
    "situation": "버려진 라디오에서 옛 노래가 흘러나온다. 가사를 모르는데 다음 소절을 알 것 같다.",
    "options": [
      {
        "id": "A",
        "label": "끝까지 듣는다",
        "record": "모르는 노래를 끝까지 들었다",
        "result": "다음 상담에서 \"익숙한 노래\"라는 감정 흔적이 떠오를 수 있다.",
        "stat": "mind",
        "extreme": "다음 상담에서 감정 흔적이 반드시 떠오른다"
      },
      {
        "id": "B",
        "label": "끈다",
        "auto": true,
        "result": "라디오를 끄고 다시 걸었다."
      }
    ]
  },
  {
    "code": "N09",
    "title": "반쯤 남은 대피소",
    "roles": [
      "ability"
    ],
    "gov": false,
    "situation": "지붕이 반쯤 남은 대피소를 찾았다.",
    "options": [
      {
        "id": "A",
        "label": "잠깐 쉬어 간다",
        "contamination": -3,
        "result": "오염이 조금 덜 쌓였다.",
        "stat": "con",
        "extreme": "오염이 줄어든다"
      },
      {
        "id": "B",
        "label": "보급품을 두고 간다",
        "result": "흔적이 생겼다. 다음 사람이 쓰면 알림이 온다."
      },
      {
        "id": "C",
        "label": "위치만 기록한다",
        "auto": true,
        "result": "지도에 대피소가 표시되었다."
      }
    ]
  },
  {
    "code": "N10",
    "title": "끊긴 무전",
    "roles": [
      "ability"
    ],
    "gov": false,
    "situation": "같은 구역에 있던 {동료}의 무전이 끊겼다.",
    "who": {
      "slot": "{동료}",
      "role": "ability",
      "npc": "한 동료"
    },
    "options": [
      {
        "id": "A",
        "label": "찾으러 간다",
        "record": "{동료}를 찾으러 갔다",
        "result": "{동료}는 무사했다. 무전기 배터리가 다 됐을 뿐이었다.",
        "stat": "dex",
        "extreme": "둘 다 판독지 동행 기록에 남는다"
      },
      {
        "id": "B",
        "label": "계속 호출한다",
        "result": "잠시 뒤 {동료}의 무전이 돌아왔다.",
        "stat": "int",
        "extreme": "무전 주파수 메모를 얻는다",
        "extremeItem": "무전 주파수 메모"
      },
      {
        "id": "C",
        "label": "재단에 알린다",
        "auto": true,
        "result": "재단이 연락을 확인해 주었다."
      }
    ]
  },
  {
    "code": "N11",
    "title": "추가 명령",
    "roles": [
      "ability"
    ],
    "gov": true,
    "situation": "출동 중 정부가 옆 구역까지 맡으라는 추가 명령을 보낸다.",
    "options": [
      {
        "id": "A",
        "label": "받아들인다",
        "record": "추가 명령을 받아들였다",
        "contamination": 6,
        "result": "두 구역에 기여했다. 오염도 더 쌓였다.",
        "stat": "craft",
        "extreme": "오염이 덜 쌓인다"
      },
      {
        "id": "B",
        "label": "이번 출동만 마치겠다고 보고한다",
        "auto": true,
        "result": "보고는 접수되었다. 불이익은 없다."
      }
    ]
  },
  {
    "code": "N12",
    "title": "처음 핀 꽃",
    "roles": [
      "ability"
    ],
    "gov": false,
    "situation": "오염이 걷힌 자리에 작은 꽃이 피어 있다. 이 구역에서 처음 본 색이다.",
    "options": [
      {
        "id": "A",
        "label": "꺾어 온다",
        "item": "처음 핀 꽃",
        "result": "기념품 \"처음 핀 꽃\"을 얻었다."
      },
      {
        "id": "B",
        "label": "그대로 둔다",
        "auto": true,
        "record": "처음 핀 꽃을 그대로 두었다",
        "result": "처음 핀 꽃을 그대로 두었다."
      },
      {
        "id": "C",
        "label": "표시해 둔다",
        "result": "익명 표식 \"여기 꽃이 피었다\"가 남는다. 이 구역이 재건되면 장소 이름 후보에 오른다."
      }
    ]
  },
  {
    "code": "F01",
    "title": "감사관",
    "roles": [
      "staff"
    ],
    "gov": true,
    "situation": "행정실에 정부 감사관이 찾아와 능력자 상담 기록 사본을 요구한다.",
    "options": [
      {
        "id": "A",
        "label": "규정대로 요약본만 낸다",
        "auto": true,
        "result": "감사관은 요약본을 받아 갔다.",
        "stat": "edu",
        "extreme": "정부 공문 \"자료 적정\""
      },
      {
        "id": "B",
        "label": "원본을 넘긴다",
        "record": "상담 기록 원본을 넘겼다",
        "result": "감사관이 만족해 돌아갔다."
      },
      {
        "id": "C",
        "label": "담당자 부재를 이유로 미룬다",
        "record": "감사를 미뤘다",
        "paper": {
          "from": "gov",
          "text": "자료 제출 지연"
        },
        "result": "감사관은 다음 주에 다시 오겠다고 했다.",
        "stat": "emp",
        "extreme": "감사관이 다시 오지 않는다",
        "fail": "감사관은 기다렸다가 요약본을 받아 갔다.",
        "failRecord": "감사를 미루려 했다",
        "failPaper": null
      }
    ]
  },
  {
    "code": "F02",
    "title": "멈춘 보일러",
    "roles": [
      "staff"
    ],
    "gov": false,
    "situation": "대욕장 보일러가 멈췄다.",
    "options": [
      {
        "id": "A",
        "label": "직접 고친다",
        "record": "보일러를 직접 고쳤다",
        "result": "반나절 걸려 고쳤다. 대욕장 복구 진행도가 올랐다.",
        "stat": "craft",
        "extreme": "대욕장 복구 진행이 크게 오른다"
      },
      {
        "id": "B",
        "label": "오늘은 문을 닫고 공지한다",
        "auto": true,
        "result": "대욕장 채널에 \"오늘 휴무\" 공지가 걸렸다."
      }
    ]
  },
  {
    "code": "F03",
    "title": "밤의 방문자",
    "roles": [
      "staff"
    ],
    "gov": false,
    "situation": "밤 근무 중, 잠들지 못한 {능력자}가 근무지에 들른다.",
    "who": {
      "slot": "{능력자}",
      "role": "ability",
      "npc": "한 능력자"
    },
    "options": [
      {
        "id": "A",
        "label": "따뜻한 것을 내준다",
        "result": "{능력자}의 다음 휴식 효과가 조금 늘었다.",
        "stat": "emp",
        "extreme": "그 능력자의 휴식 효과가 더 오른다"
      },
      {
        "id": "B",
        "label": "이야기를 들어 준다",
        "record": "밤에 찾아온 사람의 이야기를 들었다",
        "result": "밤에 찾아온 사람의 이야기를 들었다.",
        "stat": "mind",
        "extreme": "문답 \"돌보는 일에서 가장 어려운 것은?\"이 열린다"
      },
      {
        "id": "C",
        "label": "의료동을 안내한다",
        "auto": true,
        "result": "의료동 당직에게 연결해 주었다."
      }
    ]
  },
  {
    "code": "F04",
    "title": "모자란 식재료",
    "roles": [
      "staff"
    ],
    "gov": false,
    "situation": "식당 재고가 떨어져 가고 있다.",
    "options": [
      {
        "id": "A",
        "label": "있는 것으로 메뉴를 바꾼다",
        "auto": true,
        "result": "오늘의 메뉴가 \"있는 것 다 넣은 수프\"로 바뀌었다."
      },
      {
        "id": "B",
        "label": "정착지에 요청한다",
        "result": "길 위의 부탁에 \"식당 식재료 구함\"이 올라갔다. 무소속이 가져오면 둘 다 보상.",
        "stat": "emp",
        "extreme": "부탁에 덤 보상이 붙는다"
      },
      {
        "id": "C",
        "label": "내 몫을 덜어 낸다",
        "record": "내 몫을 식당에 내놓았다",
        "result": "재단 물자 하나가 식당 복구에 보태졌다."
      }
    ]
  },
  {
    "code": "F05",
    "title": "한꺼번에 핀 아킬레아",
    "roles": [
      "staff"
    ],
    "gov": false,
    "situation": "온실의 아킬레아가 한꺼번에 피었다.",
    "options": [
      {
        "id": "A",
        "label": "말려서 보관한다",
        "auto": true,
        "item": "아킬레아 말린 꽃",
        "result": "아킬레아 말린 꽃을 얻었다."
      },
      {
        "id": "B",
        "label": "식당 테이블마다 꽂는다",
        "result": "식당 채널 위에 \"오늘 식당에 꽃이 있다\"가 걸렸다."
      },
      {
        "id": "C",
        "label": "정착지에 보낸다",
        "result": "정착지로 보낼 물자에 더해졌다."
      }
    ]
  },
  {
    "code": "F06",
    "title": "주인 없는 편지",
    "roles": [
      "staff"
    ],
    "gov": false,
    "situation": "기숙사 복도에서 부치지 않은 편지를 주웠다. 받는 사람 칸이 비어 있다.",
    "options": [
      {
        "id": "A",
        "label": "분실물함에 넣는다",
        "auto": true,
        "result": "분실물함에 넣었다."
      },
      {
        "id": "B",
        "label": "기숙사 게시판에 공지한다",
        "result": "휴게실 채널에 \"주인을 찾는 편지\" 사건이 올라간다. 누구든 자기 캐릭터의 편지라고 롤플레이로 이어 갈 수 있다."
      },
      {
        "id": "C",
        "label": "읽지 않고 직접 보관한다",
        "record": "주인 없는 편지를 맡아 두었다",
        "result": "주인 없는 편지를 맡아 두었다."
      }
    ]
  },
  {
    "code": "F07",
    "title": "신입의 질문",
    "roles": [
      "staff"
    ],
    "gov": false,
    "situation": "재단에 새로 온 직원이 묻는다. \"선배는 왜 여기서 일해요?\"",
    "options": [
      {
        "id": "A",
        "label": "대답한다",
        "result": "문답 \"재단에서 일하는 이유\"가 열린다."
      },
      {
        "id": "B",
        "label": "웃어넘긴다",
        "auto": true,
        "result": "신입도 따라 웃었다."
      }
    ]
  },
  {
    "code": "F08",
    "title": "정전",
    "roles": [
      "staff"
    ],
    "gov": false,
    "situation": "의료동에 전기가 나갔다.",
    "options": [
      {
        "id": "A",
        "label": "손전등을 들고 병실을 돈다",
        "record": "정전 밤에 병실을 돌았다",
        "result": "정전 밤에 병실을 돌았다.",
        "stat": "mind",
        "extreme": "의료동 대기실 사건 \"정전의 밤\"이 남는다"
      },
      {
        "id": "B",
        "label": "발전기를 돌린다",
        "result": "정비 공구 하나를 썼다. 의료동 복구 진행도가 올랐다.",
        "stat": "craft",
        "extreme": "정비 공구를 쓰지 않는다"
      },
      {
        "id": "C",
        "label": "대기실에 남아 사람들을 안심시킨다",
        "auto": true,
        "result": "의료동 대기실 채널에 \"정전, 곧 복구 예정\"이 걸렸다."
      }
    ]
  },
  {
    "code": "F09",
    "title": "빠진 장",
    "roles": [
      "staff"
    ],
    "gov": false,
    "situation": "오래된 기록부를 정리하다 몇 장이 통째로 빠진 것을 발견했다.",
    "options": [
      {
        "id": "A",
        "label": "상부에 보고한다",
        "auto": true,
        "result": "보고는 접수되었다. 답은 오지 않았다."
      },
      {
        "id": "B",
        "label": "조용히 덮는다",
        "record": "빠진 장을 못 본 척했다",
        "result": "빠진 장을 못 본 척했다."
      },
      {
        "id": "C",
        "label": "직접 찾아본다",
        "record": "빠진 장을 찾아 나섰다",
        "result": "단서 발견 기회가 생긴다 (서버가 조건에 맞는 [단서]가 있을 때만 내려준다).",
        "stat": "int",
        "extreme": "단서 발견 기회 (조건에 맞는 [단서]가 있을 때)",
        "fail": "찾지 못했다. 어디에 있을지 짐작만 남았다.",
        "failRecord": "빠진 장을 찾아 나섰다"
      }
    ]
  },
  {
    "code": "F10",
    "title": "정착지의 왕진 편지",
    "roles": [
      "staff"
    ],
    "gov": false,
    "situation": "{정착지}에서 아픈 사람이 있으니 와 줄 수 없느냐는 편지가 왔다.",
    "options": [
      {
        "id": "A",
        "label": "다음 근무를 왕진으로 잡는다",
        "result": "다음 보내두기에 \"{정착지} 왕진\"이 근무지로 열린다."
      },
      {
        "id": "B",
        "label": "약품만 보낸다",
        "result": "정착지로 보낼 물자에 붕대 상자가 더해졌다."
      },
      {
        "id": "C",
        "label": "답장을 쓴다",
        "auto": true,
        "result": "곧 가겠다는 답장을 보냈다."
      }
    ]
  },
  {
    "code": "T01",
    "title": "두 개의 이정표",
    "roles": [
      "free"
    ],
    "gov": false,
    "situation": "이정표 두 개가 서로 다른 길을 가리킨다. 하나는 낡았고 하나는 새로 세워졌다.",
    "options": [
      {
        "id": "A",
        "label": "오래된 이정표를 따른다",
        "result": "여행 지도에 전쟁 전 옛길이 한 칸 밝혀졌다. 가끔 물품 \"낡은 지도 조각\".",
        "stat": "int",
        "extreme": "낡은 지도 조각을 반드시 얻는다",
        "extremeItem": "낡은 지도 조각"
      },
      {
        "id": "B",
        "label": "새 이정표를 따른다",
        "auto": true,
        "result": "길이 고르고 편했다. 예정보다 일찍 도착했다."
      }
    ]
  },
  {
    "code": "T02",
    "title": "소나기",
    "roles": [
      "free"
    ],
    "gov": false,
    "situation": "갑자기 비가 쏟아진다.",
    "options": [
      {
        "id": "A",
        "label": "처마 밑에서 기다린다",
        "result": "같은 처마 아래 있던 사람에게서 그 동네 이야기를 들었다. 정착지 이야기 조각 하나.",
        "stat": "emp",
        "extreme": "이야기 조각 둘"
      },
      {
        "id": "B",
        "label": "그냥 걷는다",
        "auto": true,
        "record": "비를 맞으며 걸었다",
        "result": "흠뻑 젖었지만 제시간에 도착했다."
      },
      {
        "id": "C",
        "label": "우비를 빌린다",
        "result": "가게 주인이 우비를 빌려주었다. 길 위의 부탁에 \"우비 돌려주기\"가 생긴다."
      }
    ]
  },
  {
    "code": "T03",
    "title": "장터의 상인",
    "roles": [
      "free"
    ],
    "gov": false,
    "situation": "장터 상인이 가방 속 물건을 보자며 자기 물건과 바꾸자고 한다.",
    "options": [
      {
        "id": "A",
        "label": "바꾼다",
        "result": "길 물건 하나를 내고 다른 길 물건 하나를 받았다 (고를 수 없고 상인이 정한다).",
        "stat": "emp",
        "extreme": "받을 물건을 직접 고른다",
        "fail": "상인이 고른 물건으로 바꿨다",
        "failRecord": null
      },
      {
        "id": "B",
        "label": "구경만 한다",
        "auto": true,
        "result": "장터를 한 바퀴 돌았다."
      },
      {
        "id": "C",
        "label": "상인의 이야기를 듣는다",
        "result": "어느 정착지에서 왔는지 들었다. 정착지 이야기 조각 하나.",
        "stat": "emp",
        "extreme": "상인이 다음 장날을 알려 준다 (장소 사건)"
      }
    ]
  },
  {
    "code": "T04",
    "title": "길동무",
    "roles": [
      "free"
    ],
    "gov": false,
    "situation": "같은 방향으로 가는 {여행자}를 만났다.",
    "who": {
      "slot": "{여행자}",
      "role": null,
      "npc": "낯선 여행자"
    },
    "options": [
      {
        "id": "A",
        "label": "같이 걷는다",
        "record": "{여행자}와 길을 걸었다",
        "result": ". {여행자}가 실제 캐릭터면 관계 유형 \"여행에서 만난 사이\" 신청이 뜨기 쉽게 보인다."
      },
      {
        "id": "B",
        "label": "목례만 하고 앞서 간다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      },
      {
        "id": "C",
        "label": "지름길을 알려 준다",
        "result": "{여행자}의 여행 지도에도 그 길이 밝혀진다."
      }
    ]
  },
  {
    "code": "T05",
    "title": "검문소",
    "roles": [
      "free"
    ],
    "gov": true,
    "situation": "도시 어귀의 정부 검문소에서 신분을 확인한다.",
    "options": [
      {
        "id": "A",
        "label": "순순히 응한다",
        "auto": true,
        "result": "무사히 지났다. 떠도는 능력자라면 \"특이반응자 등록 안내문\"을 한 장 받는다 (기념품, 그 이상의 일은 없다)."
      },
      {
        "id": "B",
        "label": "다른 길로 돌아간다",
        "record": "검문소를 피해 돌아갔다",
        "result": "조금 돌아갔다. 여행 지도에 샛길이 하나 밝혀졌다.",
        "stat": "dex",
        "extreme": "여행 지도 칸 둘",
        "fail": "돌아간 길에도 검문소가 있었다. 결국 검문에 응했다.",
        "failRecord": "검문소를 피하려 했다"
      },
      {
        "id": "C",
        "label": "정착지 사람들 틈에 섞인다",
        "record": "장꾼들 틈에 섞여 검문소를 지났다",
        "result": "장을 보러 가는 사람들과 함께 지났다.",
        "stat": "emp",
        "extreme": "장꾼에게서 길 물건 하나",
        "fail": "눈에 띄어 신분 확인을 받았다. 무사히 지났다.",
        "failRecord": "장꾼들 틈에 섞이려 했다"
      }
    ]
  },
  {
    "code": "T06",
    "title": "버려진 우체통",
    "roles": [
      "free"
    ],
    "gov": false,
    "situation": "길가의 우체통 안에 부치지 못한 편지 몇 통이 남아 있다.",
    "options": [
      {
        "id": "A",
        "label": "주소의 정착지로 전한다",
        "result": "길 위의 부탁 \"오래된 편지 전하기\"가 생긴다. 전하면 그 정착지 이야기 조각을 얻는다.",
        "stat": "con",
        "extreme": "받는 사람이 답장을 보낸다"
      },
      {
        "id": "B",
        "label": "그대로 둔다",
        "auto": true,
        "result": "우체통 뚜껑을 다시 닫아 두었다."
      }
    ]
  },
  {
    "code": "T07",
    "title": "정착지 아이들",
    "roles": [
      "free"
    ],
    "gov": false,
    "situation": "정착지 아이들이 다른 동네 놀이를 가르쳐 달라고 조른다.",
    "options": [
      {
        "id": "A",
        "label": "아는 놀이를 가르친다",
        "record": "{정착지} 아이들에게 놀이를 가르쳤다",
        "result": "문답 \"어릴 적 하던 놀이\"가 열린다.",
        "stat": "edu",
        "extreme": "아이들이 그 놀이 이름을 정착지 채널에 남긴다"
      },
      {
        "id": "B",
        "label": "같이 논다",
        "record": "{정착지}의 놀이를 배웠다",
        "result": "아이들의 놀이를 배웠다.",
        "stat": "dex",
        "extreme": "아이들이 작은 선물을 준다 (길 물건)"
      },
      {
        "id": "C",
        "label": "구경한다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      }
    ]
  },
  {
    "code": "T08",
    "title": "별이 잘 보이는 밤",
    "roles": [
      "free"
    ],
    "gov": false,
    "situation": "야영을 한다. 불빛이 없는 곳이라 별이 많다.",
    "options": [
      {
        "id": "A",
        "label": "늦게까지 별을 본다",
        "record": "별을 보다 늦게 잠들었다",
        "result": "별을 보다 늦게 잠들었다."
      },
      {
        "id": "B",
        "label": "일찍 잔다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      },
      {
        "id": "C",
        "label": "여행 일지를 쓴다",
        "result": "여행 일지 쓰기가 열린다 (선택)."
      }
    ]
  },
  {
    "code": "T10",
    "title": "강변의 노인",
    "roles": [
      "free"
    ],
    "gov": false,
    "situation": "가람터 강변 벤치에서 노인이 강을 보고 있다. \"여기가 왜 가람터인지 아나?\"",
    "options": [
      {
        "id": "A",
        "label": "끝까지 듣는다",
        "result": "여행 지도의 가람터 칸에 \"강가의 터\"라는 메모가 남는다."
      },
      {
        "id": "B",
        "label": "같이 강을 본다",
        "auto": true,
        "record": "강변에서 낯선 노인과 강을 봤다",
        "result": "강변에서 낯선 노인과 강을 봤다."
      }
    ]
  },
  {
    "code": "C01",
    "title": "가방 속 고양이",
    "roles": "all",
    "gov": false,
    "situation": "가방을 열었더니 길고양이가 들어가 있다.",
    "options": [
      {
        "id": "A",
        "label": "데려간다",
        "stat": "emp",
        "result": "고양이가 순순히 따라왔다. 머무는 장소 채널에 \"고양이가 생겼다\"는 사건이 올라간다."
      },
      {
        "id": "B",
        "label": "내보낸다",
        "auto": true,
        "result": "고양이는 한 번 돌아보고 갔다."
      }
    ]
  },
  {
    "code": "C02",
    "title": "새 공고문",
    "roles": "all",
    "gov": true,
    "situation": "벽에 새 공고가 붙었다. \"특이반응자를 신고하면 포상합니다.\"",
    "options": [
      {
        "id": "A",
        "label": "그대로 둔다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      },
      {
        "id": "B",
        "label": "떼어 낸다",
        "stat": "dex",
        "fail": "순찰에게 주의를 들었다 (그 이상은 없다).",
        "record": "신고 포상 공고를 떼어 냈다",
        "result": "아무도 못 봤다."
      },
      {
        "id": "C",
        "label": "사진을 찍어 재단에 보낸다",
        "record": "공고를 재단에 알렸다",
        "paper": {
          "from": "foundation",
          "text": "공고 확인함"
        },
        "result": "."
      }
    ]
  },
  {
    "code": "C03",
    "title": "장갑 한 짝",
    "roles": "all",
    "gov": false,
    "situation": "길에 장갑 한 짝이 떨어져 있다.",
    "options": [
      {
        "id": "A",
        "label": "눈에 띄는 곳에 걸어 둔다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      },
      {
        "id": "B",
        "label": "주인을 찾는다",
        "stat": "int",
        "item": "정착지 빵",
        "result": "근처 정착지 사람의 것이었다. 고맙다며 빵을 주었다 (정착지 빵)."
      }
    ]
  },
  {
    "code": "C04",
    "title": "불빛 소문",
    "roles": "all",
    "gov": false,
    "situation": "\"정화가 끝난 구역에 밤마다 불빛이 보인다\"는 소문을 들었다.",
    "options": [
      {
        "id": "A",
        "label": "귀담아듣는다",
        "result": "그 구역 장소 채널에 \"불빛 소문\" 사건이 올라간다. 무엇인지는 아무도 모른다."
      },
      {
        "id": "B",
        "label": "흘려듣는다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      }
    ]
  },
  {
    "code": "C05",
    "title": "담벼락 그림",
    "roles": "all",
    "gov": false,
    "situation": "담벼락에 아이가 그린 듯한 그림이 있다. 해와 집과 사람 셋.",
    "options": [
      {
        "id": "A",
        "label": "한 줄 덧붙인다",
        "result": "익명 표식 쓰기가 열린다."
      },
      {
        "id": "B",
        "label": "한참 본다",
        "auto": true,
        "record": "담벼락 그림 앞에 한참 서 있었다",
        "result": "담벼락 그림 앞에 한참 서 있었다."
      }
    ]
  },
  {
    "code": "C06",
    "title": "멈춘 시계탑",
    "roles": "all",
    "gov": false,
    "situation": "광장 시계탑이 엉뚱한 시각에 멈춰 있다.",
    "options": [
      {
        "id": "A",
        "label": "고쳐 본다",
        "stat": "craft",
        "statAlt": "int",
        "result": "시계가 다시 움직였다. 장소 채널에 \"시계탑이 다시 간다\" 사건."
      },
      {
        "id": "B",
        "label": "지나간다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      }
    ]
  },
  {
    "code": "C07",
    "title": "휴전 리본",
    "roles": "all",
    "gov": false,
    "situation": "거리 곳곳에 휴전 기념 리본이 달려 있다. 나눠 주는 사람이 하나를 내민다.",
    "options": [
      {
        "id": "A",
        "label": "받아서 단다",
        "record": "휴전 리본을 달았다",
        "item": "휴전 리본",
        "result": "기념품 \"휴전 리본\"."
      },
      {
        "id": "B",
        "label": "사양한다",
        "auto": true,
        "record": "휴전 리본을 받지 않았다",
        "result": "휴전 리본을 받지 않았다."
      }
    ]
  },
  {
    "code": "C08",
    "title": "사이렌 훈련",
    "roles": "all",
    "gov": true,
    "situation": "정부 대피 훈련 사이렌이 울린다.",
    "options": [
      {
        "id": "A",
        "label": "지시대로 대피한다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      },
      {
        "id": "B",
        "label": "하던 일을 계속한다",
        "stat": "mind",
        "paper": {
          "from": "gov",
          "text": "훈련 불참 확인"
        },
        "result": "일을 마쳤다. ."
      },
      {
        "id": "C",
        "label": "주변 사람들의 대피를 돕는다",
        "stat": "emp",
        "record": "훈련 때 사람들을 이끌었다",
        "result": "훈련 때 사람들을 이끌었다."
      }
    ]
  },
  {
    "code": "C09",
    "title": "흥얼거리는 노래",
    "roles": "all",
    "gov": false,
    "situation": "지나가던 사람이 오래된 노래를 흥얼거린다.",
    "options": [
      {
        "id": "A",
        "label": "따라 흥얼거린다",
        "record": "모르는 사람과 같은 노래를 흥얼거렸다",
        "result": "능력자라면 다음 상담에서 감정 흔적이 떠오를 수 있다. 다른 역할은"
      },
      {
        "id": "B",
        "label": "지나간다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      }
    ]
  },
  {
    "code": "C10",
    "title": "노을",
    "roles": "all",
    "gov": false,
    "situation": "하늘이 이상할 만큼 붉다.",
    "options": [
      {
        "id": "A",
        "label": "멈춰서 본다",
        "result": "문답 \"오늘 본 것 중 가장 좋았던 것은?\"이 열린다."
      },
      {
        "id": "B",
        "label": "계속 간다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      }
    ]
  },
  {
    "code": "C12",
    "title": "가방 검사",
    "roles": "all",
    "gov": true,
    "situation": "검문에서 가방을 열어 보라고 한다.",
    "options": [
      {
        "id": "A",
        "label": "응한다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      },
      {
        "id": "B",
        "label": "이유를 묻는다",
        "stat": "emp",
        "fail": "검사를 받고 지나갔다.",
        "record": "가방 검사 이유를 물었다",
        "result": "검사 없이 통과했다."
      }
    ]
  },
  {
    "code": "N13",
    "title": "번호로 불리다",
    "roles": [
      "ability"
    ],
    "gov": true,
    "situation": "무전에서 이름 대신 등록 번호로만 부른다. \"{등록번호}, 응답하라.\"",
    "options": [
      {
        "id": "A",
        "label": "번호로 답한다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      },
      {
        "id": "B",
        "label": "이름으로 답한다",
        "record": "번호 대신 이름으로 답했다",
        "paper": {
          "from": "gov",
          "text": "호출 응답 양식 위반"
        },
        "result": "번호 대신 이름으로 답했다."
      },
      {
        "id": "C",
        "label": "대답하지 않는다",
        "record": "번호 호출에 답하지 않았다",
        "result": "잠시 뒤 다시 호출이 왔다."
      }
    ]
  },
  {
    "code": "N14",
    "title": "흔들리는 그네",
    "roles": [
      "ability"
    ],
    "gov": false,
    "situation": "무너진 놀이터에 그네 하나가 아직 매달려 있다.",
    "options": [
      {
        "id": "A",
        "label": "고쳐 놓는다",
        "stat": "str",
        "result": "그네가 다시 걸렸다. 이 구역이 재건되면 \"놀이터\"가 장소 이름 후보에 오른다."
      },
      {
        "id": "B",
        "label": "지나간다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      }
    ]
  },
  {
    "code": "N15",
    "title": "누군가의 능력 흔적",
    "roles": [
      "ability"
    ],
    "gov": false,
    "situation": "벽에 다른 능력자가 능력을 쓴 흔적이 남아 있다. 언제 것인지 모른다.",
    "options": [
      {
        "id": "A",
        "label": "재단에 알린다",
        "paper": {
          "from": "foundation",
          "text": "흔적 확인, 보고 불필요"
        },
        "result": "."
      },
      {
        "id": "B",
        "label": "정부 보고서에 적는다",
        "record": "다른 능력자의 흔적을 정부에 보고했다",
        "paper": {
          "from": "gov",
          "text": "보고 접수"
        },
        "result": "."
      },
      {
        "id": "C",
        "label": "모른 척한다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      }
    ]
  },
  {
    "code": "N16",
    "title": "표본 추가 채취",
    "roles": [
      "ability"
    ],
    "gov": true,
    "situation": "정부가 오염 표본을 더 채취해 오라고 지시한다.",
    "options": [
      {
        "id": "A",
        "label": "채취한다",
        "stat": "edu",
        "fail": "표본이 흐트러져 빈 용기만 남았다.",
        "item": "표본 용기",
        "result": "표본 용기를 얻었다.",
        "auto": true
      },
      {
        "id": "B",
        "label": "이번에는 하지 않는다",
        "record": "표본 채취 지시를 넘겼다",
        "result": "표본 채취 지시를 넘겼다."
      }
    ]
  },
  {
    "code": "N17",
    "title": "덫에 걸린 작은 것",
    "roles": [
      "ability"
    ],
    "gov": false,
    "situation": "작은 변이 생명체가 오래된 덫에 걸려 있다. 해를 끼칠 것 같지는 않다.",
    "options": [
      {
        "id": "A",
        "label": "풀어 준다",
        "stat": "dex",
        "record": "덫에 걸린 변이체를 풀어 주었다",
        "result": "그것은 덤불 속으로 사라졌다."
      },
      {
        "id": "B",
        "label": "정부에 신고한다",
        "result": "정부 회수반이 갔다."
      },
      {
        "id": "C",
        "label": "지나간다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      }
    ]
  },
  {
    "code": "N18",
    "title": "낯선 집 꿈",
    "roles": [
      "ability"
    ],
    "gov": false,
    "situation": "잠깐 눈을 붙였는데, 가 본 적 없는 집 꿈을 꾸었다.",
    "options": [
      {
        "id": "A",
        "label": "꿈을 적어 둔다",
        "result": "문답 \"꿈에서 본 집은 어떤 곳이었나?\"가 열린다."
      },
      {
        "id": "B",
        "label": "털고 일어난다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      }
    ]
  },
  {
    "code": "N19",
    "title": "떨어진 보급 상자",
    "roles": [
      "ability"
    ],
    "gov": true,
    "situation": "정부 수송기가 떨어뜨린 보급 상자가 정착지 가까이에 떨어졌다.",
    "options": [
      {
        "id": "A",
        "label": "정부에 반납한다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      },
      {
        "id": "B",
        "label": "정착지에 나눠 준다",
        "record": "정부 보급품을 정착지에 나눴다",
        "paper": {
          "from": "gov",
          "text": "보급품 분실 조사"
        },
        "result": "정착지 재건에 조금 보태졌다. ."
      },
      {
        "id": "C",
        "label": "반은 반납, 반은 나눈다",
        "stat": "emp",
        "fail": "정착지 사람들이 사양해서 전부 반납했다.",
        "result": "둘 다 무사히 해냈다."
      }
    ]
  },
  {
    "code": "N20",
    "title": "감독관의 지름길",
    "roles": [
      "ability"
    ],
    "gov": true,
    "situation": "동행한 정부 감독관이 위험해 보이는 지름길로 가라고 지시한다.",
    "options": [
      {
        "id": "A",
        "label": "따른다",
        "stat": "dex",
        "fail": "조금 다쳤다 (출동 효율 소폭 감소, 다음 휴식에 회복).",
        "result": "빨리 도착했다."
      },
      {
        "id": "B",
        "label": "거부하고 돌아간다",
        "record": "감독관의 지시를 거부했다",
        "paper": {
          "from": "gov",
          "text": "지시 불이행"
        },
        "result": "감독관의 지시를 거부했다.",
        "auto": true
      },
      {
        "id": "C",
        "label": "다른 길을 제안한다",
        "stat": "int",
        "fail": "결국 돌아갔다.",
        "result": "감독관이 받아들였다."
      }
    ]
  },
  {
    "code": "N21",
    "title": "폐허의 일기장",
    "roles": [
      "ability"
    ],
    "gov": false,
    "situation": "무너진 집에서 일기장을 주웠다. 앞 몇 장만 젖지 않았다.",
    "options": [
      {
        "id": "A",
        "label": "읽는다",
        "record": "모르는 사람의 일기를 읽었다",
        "result": "모르는 사람의 일기를 읽었다."
      },
      {
        "id": "B",
        "label": "재단 도서실에 맡긴다",
        "result": "도서실 채널에 \"주인 모를 일기장\" 사건."
      },
      {
        "id": "C",
        "label": "그 자리에 둔다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      }
    ]
  },
  {
    "code": "N22",
    "title": "오염된 우물",
    "roles": [
      "ability"
    ],
    "gov": false,
    "situation": "정착지 근처 우물에 오염 수치가 남아 있다.",
    "options": [
      {
        "id": "A",
        "label": "직접 정화한다",
        "stat": "craft",
        "result": "우물이 맑아졌다. 정착지 재건에 보태지고 정착지 채널에 \"우물물이 맑아졌다\"."
      },
      {
        "id": "B",
        "label": "재단에 보고한다",
        "auto": true,
        "result": "재단 직원 근무지에 \"정착지 우물 점검\"이 열린다."
      }
    ]
  },
  {
    "code": "N23",
    "title": "홍보 사진",
    "roles": [
      "ability"
    ],
    "gov": true,
    "situation": "정부 홍보팀이 \"정화 작업의 영웅\" 사진을 찍겠다고 한다.",
    "options": [
      {
        "id": "A",
        "label": "찍는다",
        "record": "정부 홍보 사진을 찍었다",
        "result": "헤일렌 전광판에 사진이 걸렸다는 소문이 돈다."
      },
      {
        "id": "B",
        "label": "거절한다",
        "record": "홍보 사진을 거절했다",
        "result": "홍보 사진을 거절했다.",
        "auto": true
      },
      {
        "id": "C",
        "label": "동료들과 함께라면 찍겠다고 한다",
        "stat": "emp",
        "fail": "혼자 찍혔다.",
        "result": "같은 구역에 다녀간 사람들과 함께 찍혔다."
      }
    ]
  },
  {
    "code": "N24",
    "title": "말을 듣지 않는 능력",
    "roles": [
      "ability"
    ],
    "gov": false,
    "situation": "능력이 잠깐 뜻대로 되지 않는다.",
    "options": [
      {
        "id": "A",
        "label": "잠시 쉰다",
        "auto": true,
        "result": "금방 돌아왔다."
      },
      {
        "id": "B",
        "label": "집중해서 다시 해 본다",
        "stat": "mind",
        "fail": "오염이 조금 더 쌓였다.",
        "failContamination": 4,
        "result": "해냈다. 기여가 조금 늘었다."
      }
    ]
  },
  {
    "code": "F11",
    "title": "새 보고 서식",
    "roles": [
      "staff"
    ],
    "gov": true,
    "situation": "정부가 \"관리대상자 생활 기록 주간 보고\" 서식을 새로 내려보냈다.",
    "options": [
      {
        "id": "A",
        "label": "서식대로 꼼꼼히 쓴다",
        "stat": "edu",
        "paper": {
          "from": "gov",
          "text": "보고 적정"
        },
        "result": "."
      },
      {
        "id": "B",
        "label": "최소한만 쓴다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      },
      {
        "id": "C",
        "label": "재단 방식으로 고쳐 쓴다",
        "stat": "emp",
        "record": "정부 서식을 재단 방식으로 고쳐 썼다",
        "paper": {
          "from": "foundation",
          "text": "보고 방식 조정"
        },
        "result": "."
      }
    ]
  },
  {
    "code": "F12",
    "title": "동료의 생일",
    "roles": [
      "staff"
    ],
    "gov": false,
    "situation": "오늘이 동료 직원의 생일이다. 설탕도 밀가루도 넉넉하지 않다.",
    "options": [
      {
        "id": "A",
        "label": "통조림 과일로 케이크 흉내를 낸다",
        "stat": "craft",
        "fail": "모양이 무너졌지만 다들 한 숟갈씩 나눠 먹었다.",
        "result": "식당 채널에 \"흉내 낸 케이크\" 사건."
      },
      {
        "id": "B",
        "label": "카드를 돌린다",
        "result": "재단 직원들의 한마디가 모인다는 사건이 휴게실에 올라간다."
      },
      {
        "id": "C",
        "label": "모른 척한다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      }
    ]
  },
  {
    "code": "F14",
    "title": "기증받은 책",
    "roles": [
      "staff"
    ],
    "gov": true,
    "situation": "기증받은 책 상자에 정부 회수 목록에 오른 책이 한 권 섞여 있다.",
    "options": [
      {
        "id": "A",
        "label": "목록대로 신고한다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      },
      {
        "id": "B",
        "label": "서가 맨 아래 칸에 꽂는다",
        "record": "회수 목록의 책을 서가에 두었다",
        "result": "회수 목록의 책을 서가에 두었다."
      },
      {
        "id": "C",
        "label": "먼저 읽어 본다",
        "stat": "edu",
        "fail": "어려워서 몇 장 못 읽었다.",
        "result": "단서 발견 기회 (조건에 맞는 [단서]가 있을 때)."
      }
    ]
  },
  {
    "code": "F15",
    "title": "온실의 벌레",
    "roles": [
      "staff"
    ],
    "gov": false,
    "situation": "온실 잎사귀에 벌레가 잔뜩 붙었다.",
    "options": [
      {
        "id": "A",
        "label": "손으로 잡는다",
        "stat": "dex",
        "result": "해냈다."
      },
      {
        "id": "B",
        "label": "약을 만든다",
        "stat": "craft",
        "result": "해냈다."
      },
      {
        "id": "C",
        "label": "그냥 둔다",
        "auto": true,
        "result": "아킬레아 몇 송이가 시들었다."
      }
    ]
  },
  {
    "code": "F17",
    "title": "신입 교육",
    "roles": [
      "staff"
    ],
    "gov": false,
    "situation": "신입 직원 교육을 맡게 되었다.",
    "options": [
      {
        "id": "A",
        "label": "직접 가르친다",
        "stat": "edu",
        "record": "신입을 직접 가르쳤다",
        "result": "신입을 직접 가르쳤다."
      },
      {
        "id": "B",
        "label": "매뉴얼을 건넨다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      }
    ]
  },
  {
    "code": "F18",
    "title": "사라진 열쇠꾸러미",
    "roles": [
      "staff"
    ],
    "gov": false,
    "situation": "기숙사 관리인 열쇠꾸러미가 없어졌다.",
    "options": [
      {
        "id": "A",
        "label": "찾아본다",
        "stat": "int",
        "fail": "예비 열쇠를 썼다.",
        "result": "세탁실 바구니 안에 있었다."
      },
      {
        "id": "B",
        "label": "예비 열쇠를 쓴다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      }
    ]
  },
  {
    "code": "F19",
    "title": "밤샘 서류",
    "roles": [
      "staff"
    ],
    "gov": false,
    "situation": "밀린 서류가 산더미다.",
    "options": [
      {
        "id": "A",
        "label": "오늘 다 끝낸다",
        "stat": "con",
        "fail": "반쯤 하다 잠들었다.",
        "result": "다 끝냈다. 행정실 복구 진행이 오른다."
      },
      {
        "id": "B",
        "label": "내일로 미룬다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      }
    ]
  },
  {
    "code": "F20",
    "title": "연락관의 부탁",
    "roles": [
      "staff"
    ],
    "gov": true,
    "situation": "정부 연락관이 조용히 부탁한다. 정착지에 사는 가족에게 물건을 전해 달라고.",
    "options": [
      {
        "id": "A",
        "label": "들어준다",
        "record": "정부 연락관의 사적인 부탁을 들어주었다",
        "result": "길 위의 부탁에 \"연락관의 꾸러미\"가 올라간다."
      },
      {
        "id": "B",
        "label": "거절한다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      },
      {
        "id": "C",
        "label": "재단 우편으로 정식으로 보내라고 한다",
        "stat": "edu",
        "record": "규정대로 처리하게 했다",
        "result": "연락관이 그렇게 했다."
      }
    ]
  },
  {
    "code": "F21",
    "title": "대기실의 아이",
    "roles": [
      "staff"
    ],
    "gov": false,
    "situation": "의료동 대기실에서 보호자를 기다리던 아이가 운다.",
    "options": [
      {
        "id": "A",
        "label": "같이 놀아 준다",
        "stat": "emp",
        "result": "아이가 웃었다."
      },
      {
        "id": "B",
        "label": "아껴 둔 사탕을 준다",
        "result": "아이가 울음을 그쳤다."
      },
      {
        "id": "C",
        "label": "보호자를 찾아본다",
        "auto": true,
        "result": "보호자가 곧 왔다."
      }
    ]
  },
  {
    "code": "F22",
    "title": "멈춘 세탁기",
    "roles": [
      "staff"
    ],
    "gov": false,
    "situation": "세탁실 세탁기가 멈췄다.",
    "options": [
      {
        "id": "A",
        "label": "직접 고친다",
        "stat": "craft",
        "result": "해냈다."
      },
      {
        "id": "B",
        "label": "손빨래로 버틴다",
        "stat": "str",
        "item": "깨끗한 담요",
        "result": "담요가 깨끗해졌다. 깨끗한 담요 하나."
      },
      {
        "id": "C",
        "label": "고장 공지를 붙인다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      }
    ]
  },
  {
    "code": "F23",
    "title": "재단 기념 행사",
    "roles": [
      "staff"
    ],
    "gov": false,
    "situation": "재단 창립 기념일이다. 강당을 빌릴 예산이 없어 휴게실에서 조촐하게 한다. 정부 참관인도 한 사람 온다고 한다.",
    "options": [
      {
        "id": "A",
        "label": "준비를 맡는다",
        "stat": "emp",
        "result": "휴게실 채널에 \"조촐한 기념일\" 사건. 참관인은 맨 뒷자리에서 메모만 하다 갔다. 그날 휴게실에서 쉰 캐릭터의 회복이 조금 늘어난다."
      },
      {
        "id": "B",
        "label": "자리만 지킨다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      }
    ]
  },
  {
    "code": "F24",
    "title": "퇴근길",
    "roles": [
      "staff"
    ],
    "gov": false,
    "situation": "근무가 끝났다.",
    "options": [
      {
        "id": "A",
        "label": "정착지 가는 차를 얻어 탄다",
        "result": "다음 근무지에 \"{정착지} 왕진\"이 열린다."
      },
      {
        "id": "B",
        "label": "걸어서 돌아간다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      },
      {
        "id": "C",
        "label": "식당에 들른다",
        "result": "지금 식당에 머무는 캐릭터에게  버튼이 생긴다."
      }
    ]
  },
  {
    "code": "T11",
    "title": "거리의 악사",
    "roles": [
      "free"
    ],
    "gov": false,
    "situation": "광장에서 악사가 연주하고 있다.",
    "options": [
      {
        "id": "A",
        "label": "함께 노래한다",
        "stat": "emp",
        "result": "사람들이 모였다. 장소 채널에 \"광장의 노래\" 사건."
      },
      {
        "id": "B",
        "label": "가진 물건 하나를 놓고 간다",
        "item": "장터 엽서",
        "result": "길 물건 하나를 내고, 악사가 엽서 한 장을 준다 (장터 엽서)."
      },
      {
        "id": "C",
        "label": "듣고 간다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      }
    ]
  },
  {
    "code": "T12",
    "title": "길 잃은 아이",
    "roles": [
      "free"
    ],
    "gov": false,
    "situation": "정착지에서 아이 하나가 엄마를 찾고 있다.",
    "options": [
      {
        "id": "A",
        "label": "같이 찾는다",
        "stat": "int",
        "fail": "한참 걸렸지만 찾았다.",
        "result": "금방 찾았다."
      },
      {
        "id": "B",
        "label": "마을 사람에게 알린다",
        "auto": true,
        "result": "마을 사람들이 찾아 주었다."
      }
    ]
  },
  {
    "code": "T13",
    "title": "붐비는 가게",
    "roles": [
      "free"
    ],
    "gov": false,
    "situation": "이웃 가게에 손님이 몰렸다. 가게 주인이 쩔쩔맨다.",
    "options": [
      {
        "id": "A",
        "label": "일을 돕는다",
        "stat": "craft",
        "result": "가게 주인이 길 물건 하나를 주었다."
      },
      {
        "id": "B",
        "label": "내 일을 한다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      }
    ]
  },
  {
    "code": "T14",
    "title": "비 새는 지붕",
    "roles": [
      "free"
    ],
    "gov": false,
    "situation": "묵는 곳 지붕에서 비가 샌다.",
    "options": [
      {
        "id": "A",
        "label": "지붕에 올라가 고친다",
        "stat": "str",
        "result": "해냈다."
      },
      {
        "id": "B",
        "label": "양동이를 받쳐 둔다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      }
    ]
  },
  {
    "code": "T15",
    "title": "오래된 사진관",
    "roles": [
      "free"
    ],
    "gov": false,
    "situation": "노인이 운영하는 사진관. 사진 한 장 찍어 주겠다고 한다.",
    "options": [
      {
        "id": "A",
        "label": "찍는다",
        "result": "꾸미기 장식 \"흑백 사진\"을 얻는다 (판독지 사진 칸 틀, 판독지에 붙일 수 있다)."
      },
      {
        "id": "B",
        "label": "사양한다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      }
    ]
  },
  {
    "code": "T16",
    "title": "인구 조사원",
    "roles": [
      "free"
    ],
    "gov": true,
    "situation": "정부 인구 조사원이 이름과 머무는 곳을 묻는다. 떠도는 능력자라면 등록 안내문도 내민다.",
    "options": [
      {
        "id": "A",
        "label": "응한다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      },
      {
        "id": "B",
        "label": "정중히 거절한다",
        "stat": "emp",
        "record": "인구 조사를 거절했다",
        "result": "조사원이 그냥 갔다."
      },
      {
        "id": "C",
        "label": "이름만 적는다",
        "record": "인구 조사에 이름만 적었다",
        "result": "인구 조사에 이름만 적었다."
      }
    ]
  },
  {
    "code": "T17",
    "title": "합동 생일",
    "roles": [
      "free"
    ],
    "gov": false,
    "situation": "이 정착지에는 피난 통에 자기 생일을 잊은 사람이 많다. 그래서 일 년에 한 번, 모두의 생일을 한날 챙긴다. 오늘이 그날이다. 모닥불 옆에 빈 의자가 몇 개 놓여 있다.",
    "options": [
      {
        "id": "A",
        "label": "같이 생일 노래를 부른다",
        "stat": "emp",
        "record": "{정착지}의 합동 생일에 노래를 불렀다",
        "result": "정착지 채널에 \"합동 생일\" 사건."
      },
      {
        "id": "B",
        "label": "선물을 놓고 간다",
        "result": "길 물건 하나를 내고, 정착지 이야기 조각을 얻는다."
      },
      {
        "id": "C",
        "label": "멀리서 지켜본다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      }
    ]
  },
  {
    "code": "T18",
    "title": "여울",
    "roles": [
      "free"
    ],
    "gov": false,
    "situation": "얕은 여울을 건너면 길이 훨씬 짧아진다.",
    "options": [
      {
        "id": "A",
        "label": "건넌다",
        "stat": "dex",
        "fail": "신발이 젖었다.",
        "result": "빨리 도착했다."
      },
      {
        "id": "B",
        "label": "다리로 돌아간다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      }
    ]
  },
  {
    "code": "T19",
    "title": "별자리",
    "roles": [
      "free"
    ],
    "gov": false,
    "situation": "오늘 밤은 별이 유난히 많다.",
    "options": [
      {
        "id": "A",
        "label": "별자리를 짚어 본다",
        "stat": "edu",
        "result": "여행 지도에 \"별이 잘 보이는 곳\" 메모가 남는다."
      },
      {
        "id": "B",
        "label": "그냥 본다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      }
    ]
  },
  {
    "code": "T21",
    "title": "바뀐 가방",
    "roles": [
      "free"
    ],
    "gov": false,
    "situation": "숙소에서 다른 여행자 가방과 바뀌었다.",
    "options": [
      {
        "id": "A",
        "label": "주인을 찾아간다",
        "stat": "int",
        "result": "주인이 고맙다며 길 물건 하나를 주었다."
      },
      {
        "id": "B",
        "label": "정착지 분실물함에 맡긴다",
        "auto": true,
        "result": "다음 날 내 가방이 돌아왔다."
      }
    ]
  },
  {
    "code": "T22",
    "title": "녹슨 철로",
    "roles": [
      "free"
    ],
    "gov": false,
    "situation": "오래된 철로가 지평선까지 뻗어 있다.",
    "options": [
      {
        "id": "A",
        "label": "철로를 따라 걷는다",
        "stat": "con",
        "fail": "하나.",
        "result": "여행 지도 칸 둘."
      },
      {
        "id": "B",
        "label": "큰길로 간다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      }
    ]
  },
  {
    "code": "T23",
    "title": "배급 줄",
    "roles": [
      "free"
    ],
    "gov": true,
    "situation": "정부 배급소 앞에 줄이 길다. 배급표가 없는 사람이 맨 끝에서 서성인다.",
    "options": [
      {
        "id": "A",
        "label": "줄을 선다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      },
      {
        "id": "B",
        "label": "내 자리를 양보한다",
        "record": "배급 줄 자리를 양보했다",
        "result": "배급 줄 자리를 양보했다."
      },
      {
        "id": "C",
        "label": "그 사람의 배급표 신청을 돕는다",
        "stat": "edu",
        "fail": "서류가 모자라 다음 주로 미뤄졌다.",
        "result": "신청이 받아들여졌다."
      }
    ]
  },
  {
    "code": "T24",
    "title": "돌아갈 곳",
    "roles": [
      "free"
    ],
    "gov": false,
    "situation": "오래 걸었다. 문득 어디로 돌아가야 하는지 생각한다.",
    "requires": "origin",
    "options": [
      {
        "id": "A",
        "label": "출신 정착지 쪽으로 방향을 잡는다",
        "result": "다음 다녀오기 목적지에 {출신 정착지}가 맨 위에 뜬다."
      },
      {
        "id": "B",
        "label": "정하지 않는다",
        "auto": true,
        "result": "문답 \"돌아갈 곳이 있다면 어디인가?\"가 열린다."
      }
    ]
  },
  {
    "code": "S01",
    "title": "눈 덮인 구역",
    "roles": [
      "ability"
    ],
    "gov": false,
    "season": "snow",
    "situation": "출동한 구역에 첫눈이 내린다. 눈이 쌓여 계측기 수치가 자꾸 흔들린다.",
    "options": [
      {
        "id": "A",
        "label": "수치를 다시 읽으며 간다",
        "stat": "int",
        "fail": "계측기를 몇 번이나 다시 읽었다.",
        "result": "흔들리는 수치 사이로 길을 찾았다. 정화 기여가 조금 늘었다."
      },
      {
        "id": "B",
        "label": "눈이 그칠 때까지 기다린다",
        "auto": true,
        "result": "눈이 그친 뒤 일을 마쳤다."
      },
      {
        "id": "C",
        "label": "눈 위에 길을 내 둔다",
        "record": "첫눈 위에 길을 내 두었다",
        "result": "흔적이 생겼다. 다음 사람은 발자국을 따라 안전한 길로 간다."
      }
    ]
  },
  {
    "code": "S02",
    "title": "모자란 담요",
    "roles": [
      "staff"
    ],
    "gov": false,
    "season": "snow",
    "situation": "첫눈이 오자 기숙사가 추워졌다. 담요가 모두에게 돌지 않는다.",
    "options": [
      {
        "id": "A",
        "label": "담요를 다시 나눈다",
        "stat": "emp",
        "fail": "몇 사람은 한 장을 둘이 나눠 덮었다.",
        "record": "첫눈 밤에 담요를 나눠다",
        "result": "모두에게 한 장씩 돌아갔다."
      },
      {
        "id": "B",
        "label": "내 담요를 내놓는다",
        "record": "내 담요를 내놓았다",
        "result": "깨끗한 담요 하나를 썼다."
      },
      {
        "id": "C",
        "label": "창고 재고를 보고한다",
        "auto": true,
        "result": "행정실에 재고 보고가 올라갔다."
      }
    ]
  },
  {
    "code": "S03",
    "title": "눈길",
    "roles": [
      "free"
    ],
    "gov": false,
    "season": "snow",
    "situation": "다녀오는 길에 눈이 쌓였다. 길 표시가 보이지 않는다.",
    "options": [
      {
        "id": "A",
        "label": "눈길을 끝까지 걷는다",
        "stat": "con",
        "fail": "해가 진 뒤에 도착했다.",
        "result": "예정대로 도착했다. 여행 지도에 \"눈 덮인 길\" 메모가 남는다."
      },
      {
        "id": "B",
        "label": "가까운 정착지에서 하룻밤 묵는다",
        "record": "눈 오는 밤 {정착지}에 묵었다",
        "result": "정착지 이야기 조각 하나."
      },
      {
        "id": "C",
        "label": "눈이 녹기를 기다린다",
        "auto": true,
        "result": "하루 늦게 도착했다."
      }
    ]
  },
  {
    "code": "S04",
    "title": "길가의 눈사람",
    "roles": "all",
    "gov": false,
    "season": "snow",
    "situation": "누군가 길가에 작은 눈사람을 만들어 두었다. 눈 대신 병뚜껑 두 개가 박혀 있다.",
    "options": [
      {
        "id": "A",
        "label": "옆에 하나 더 만든다",
        "record": "첫눈에 눈사람을 만들었다",
        "result": "머무는 장소 채널에 \"눈사람이 둘이 됐다\" 사건이 올라간다."
      },
      {
        "id": "B",
        "label": "장갑 한 짝을 끼워 준다",
        "record": "눈사람에게 장갑을 끼워 주었다",
        "result": "손뜨개 장갑 하나를 내놓았다."
      },
      {
        "id": "C",
        "label": "지나간다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      }
    ]
  },
  {
    "code": "S05",
    "title": "잠긴 통로",
    "roles": [
      "ability"
    ],
    "gov": true,
    "season": "rain",
    "situation": "구역의 지하 통로가 빗물에 잠겼다. 정부는 예정대로 진행하라고 한다.",
    "options": [
      {
        "id": "A",
        "label": "예정대로 들어간다",
        "stat": "con",
        "fail": "물살에 밀려 일부만 마치고 나왔다.",
        "contamination": 6,
        "result": "물을 헤치고 일을 마쳤다. 오염이 조금 더 쌓였다."
      },
      {
        "id": "B",
        "label": "물이 빠질 때까지 미룬다고 보고한다",
        "record": "장마 속 출동 일정을 미뤄다",
        "paper": {
          "from": "gov",
          "text": "일정 지연 보고"
        },
        "result": "장마 속 출동 일정을 미뤄다."
      },
      {
        "id": "C",
        "label": "지상 구역부터 정리한다",
        "auto": true,
        "result": "지상 구역부터 정리했다."
      }
    ]
  },
  {
    "code": "S06",
    "title": "새는 천장",
    "roles": [
      "staff"
    ],
    "gov": false,
    "season": "rain",
    "situation": "도서실 천장에서 비가 새어 책장 위로 떨어진다.",
    "options": [
      {
        "id": "A",
        "label": "책부터 옮긴다",
        "stat": "str",
        "fail": "몇 권은 젖었다. 말려서 다시 꼽았다.",
        "record": "장마에 책을 옮겼다",
        "result": "젖기 전에 다 옮겼다."
      },
      {
        "id": "B",
        "label": "지붕을 손본다",
        "stat": "craft",
        "fail": "새는 곳을 줄이기만 했다.",
        "result": "비가 멎었다. 도서실 복구 진행이 오른다."
      },
      {
        "id": "C",
        "label": "양동이를 받친다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      }
    ]
  },
  {
    "code": "S07",
    "title": "끊긴 길",
    "roles": [
      "free"
    ],
    "gov": false,
    "season": "rain",
    "situation": "비에 길이 끊겨 {정착지} 사람들의 발이 묶였다.",
    "options": [
      {
        "id": "A",
        "label": "다른 길로 돌아 소식을 전한다",
        "fail": "한참 돌아서 닿았다.",
        "record": "장마에 끊긴 길을 돌아 소식을 전했다",
        "result": "이웃 정착지에 소식이 닿았다."
      },
      {
        "id": "B",
        "label": "남아서 모래주머니를 쌓는다",
        "stat": "str",
        "fail": "물은 조금 들어왔지만 집은 무사했다.",
        "result": "물이 더 들어오지 않았다. 정착지 재건에 조금 보태졌다."
      },
      {
        "id": "C",
        "label": "비가 그치기를 기다린다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      }
    ]
  },
  {
    "code": "S08",
    "title": "젖은 편지",
    "roles": "all",
    "gov": false,
    "season": "rain",
    "situation": "처마 밑에 젖은 편지 한 통이 떨어져 있다. 글씨가 번져 받는 사람 이름만 읽힌다.",
    "options": [
      {
        "id": "A",
        "label": "받는 사람을 찾아 준다",
        "stat": "int",
        "fail": "찾지 못해 분실물함에 맡겼다.",
        "record": "젖은 편지를 주인에게 전했다",
        "result": "같은 이름의 사람을 찾았다."
      },
      {
        "id": "B",
        "label": "말려서 분실물함에 넣는다",
        "auto": true,
        "result": "편지를 말려 분실물함에 넣었다."
      }
    ]
  },
  {
    "code": "S09",
    "title": "기념식 명단",
    "roles": [
      "ability"
    ],
    "gov": true,
    "season": "truce",
    "situation": "정부가 휴전 기념식 참석자 명단에 관리대상자 한 명을 올리려 한다.",
    "options": [
      {
        "id": "A",
        "label": "참석한다",
        "record": "휴전 기념식에 나갔다",
        "paper": {
          "from": "gov",
          "text": "행사 참석 확인"
        },
        "result": "맨 앞줄에 서서 자리를 지켰다."
      },
      {
        "id": "B",
        "label": "출동 일정을 이유로 빠진다",
        "stat": "emp",
        "fail": "결국 맨 뒷줄에 섰다.",
        "record": "휴전 기념식에 빠졌다",
        "result": "정부가 받아들였다."
      },
      {
        "id": "C",
        "label": "재단에 판단을 맡긴다",
        "auto": true,
        "paper": {
          "from": "foundation",
          "text": "행사 불참 통보함"
        },
        "result": "재단이 대신 답했다."
      }
    ]
  },
  {
    "code": "S10",
    "title": "빈 의자",
    "roles": [
      "staff"
    ],
    "gov": false,
    "season": "truce",
    "situation": "휴전 기념일 저녁, 식당에는 돌아오지 않은 사람들의 자리를 하나 비워 두는 관례가 있다.",
    "options": [
      {
        "id": "A",
        "label": "자리를 차린다",
        "record": "휴전 기념일에 빈자리를 차렸다",
        "result": "식당 채널에 \"빈 의자 하나\" 사건이 올라간다."
      },
      {
        "id": "B",
        "label": "말린 꽃을 놓는다",
        "record": "빈 의자에 꽃을 놓았다",
        "result": "아킬레아 말린 꽃 하나를 놓았다."
      },
      {
        "id": "C",
        "label": "평소처럼 일한다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      }
    ]
  },
  {
    "code": "S11",
    "title": "옛 경계 표지",
    "roles": [
      "free"
    ],
    "gov": false,
    "season": "truce",
    "situation": "다녀오는 길에 전쟁 때 세운 경계 표지가 아직 서 있다. 누군가 리본을 매어 두었다.",
    "options": [
      {
        "id": "A",
        "label": "표지의 글씨를 옮겨 적는다",
        "stat": "edu",
        "fail": "글씨가 닳아 반만 적었다.",
        "result": "여행 지도에 \"옛 경계 표지\" 메모가 남는다."
      },
      {
        "id": "B",
        "label": "한참 서 있다가 간다",
        "record": "옛 경계 표지 앞에 서 있었다",
        "result": "옛 경계 표지 앞에 서 있었다."
      },
      {
        "id": "C",
        "label": "지나간다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      }
    ]
  },
  {
    "code": "S12",
    "title": "묵념 사이렌",
    "roles": "all",
    "gov": true,
    "season": "truce",
    "situation": "정오에 휴전 기념 묵념 사이렌이 울린다. 거리의 사람들이 멈춰 선다.",
    "who": {
      "slot": "{동료}",
      "role": null,
      "npc": "한 동료"
    },
    "options": [
      {
        "id": "A",
        "label": "멈춰 선다",
        "auto": true,
        "result": "별일 없이 지나갔다."
      },
      {
        "id": "B",
        "label": "하던 일을 마저 한다",
        "stat": "mind",
        "paper": {
          "from": "gov",
          "text": "묵념 불참 확인"
        },
        "result": "일을 마쳤다."
      },
      {
        "id": "C",
        "label": "{동료} 곁에 가서 선다",
        "record": "묵념 때 {동료}의 곁에 섰다",
        "result": "묵념 때 {동료}의 곁에 섰다."
      }
    ]
  }
];
