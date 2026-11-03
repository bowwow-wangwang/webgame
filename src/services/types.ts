import type {
  ActiveSend,
  Condition,
  ModAction,
  ModRequest,
  ReportCase,
  Sanction,
  NotificationSettings,
  Fork,
  ForkOutcome,
  RestKind,
  RestOptions,
  SendResult,
  Activity,
  DirectoryEntry,
  Dossier,
  RelationRequest,
  RelKind,
  Role,
  InboxItem,
  Message,
  Persona,
  ReportPart,
  ReportReason,
  Room,
  Character,
  CharacterDraft,
  Place,
  QnaPrompt,
  Result,
  SendOptions,
  SendRequest,
  Session,
  Settlement,
} from '../types/domain';

/**
 * 화면이 데이터를 얻는 유일한 창구.
 * 지금은 가짜 구현(mock)이고, Supabase가 붙으면 같은 모양으로 구현을 바꾼다.
 * 판정, 보상, 번호 매기기처럼 서버가 할 일은 화면이 아니라 이 뒤쪽에서 한다.
 */
export interface GameService {
  getSession(): Promise<Session | null>;
  signIn(email: string, password: string): Promise<Result<Session>>;
  signOut(): Promise<void>;
  checkInviteCode(code: string): Promise<boolean>;
  signUp(input: { inviteCode: string; email: string; password: string }): Promise<Result<Session>>;

  listMyCharacters(): Promise<Character[]>;
  getCharacter(id: string): Promise<Character | null>;
  listSettlements(): Promise<Settlement[]>;
  loadDraft(): Promise<CharacterDraft | null>;
  saveDraft(draft: CharacterDraft): Promise<string>;
  /** 등록 번호를 붙이고 금칙어와 능력치 합계를 다시 검사한다. */
  registerCharacter(draft: CharacterDraft): Promise<Result<Character>>;

  getQnaPrompt(occasion: 'created'): Promise<QnaPrompt | null>;
  answerQna(characterId: string, promptId: string, text: string): Promise<Result<void>>;

  getSendOptions(characterId: string): Promise<SendOptions>;
  startSend(req: SendRequest): Promise<Result<ActiveSend>>;
  getSend(id: string): Promise<ActiveSend | null>;
  /** 첫 보내두기 뒤 알림 권한을 허용하면 이 기기의 구독을 저장한다. */
  savePushSubscription(subscription: PushSubscriptionJSON | null): Promise<Result<void>>;

  /** 지금 가장 많이 머무는 장소 채널. 처음 안내의 마지막에 보여 준다. */
  getBusiestPlace(): Promise<Place | null>;
  listMySends(): Promise<ActiveSend[]>;

  // ── 하루 한 바퀴: 판정, 갈림길, 오염, 휴식 ──
  /** 능력자는 오염 수치, 다른 역할은 null. 판정 감점과 폭주 여부도 서버가 정한다. */
  listConditions(): Promise<Condition[]>;
  getCondition(characterId: string): Promise<Condition | null>;
  /** 도착한 갈림길 (아직 안 왔으면 null). */
  getFork(sendId: string): Promise<Fork | null>;
  chooseFork(sendId: string, optionId: string): Promise<Result<ForkOutcome>>;
  /** 끝난 보내두기의 결과. 판정은 끝나는 순간 서버가 이미 굴려 두었다. 열면 "본 것"으로 표시한다. */
  getSendResult(sendId: string): Promise<Result<SendResult>>;
  /** 실패한 판정을 한 번 더 굴린다. 능력자는 오염이 오르고, 다른 역할은 덤을 포기한다. */
  pushSend(sendId: string): Promise<Result<SendResult>>;
  getRestOptions(characterId: string): Promise<RestOptions>;
  startRest(req: { characterId: string; kind: RestKind; hours: number }): Promise<Result<ActiveSend>>;
  /** 테스트 화면에서만 있는 도구. Supabase 구현에는 없다. */
  dev?: {
    finishNow(sendId: string): Promise<void>;
    bringFork(sendId: string): Promise<boolean>;
    /** 다음 판정 한 번의 주사위 값을 정해 둔다 (연출 확인용). */
    setNextRoll(value: number | null): Promise<void>;
    setContamination(characterId: string, value: number): Promise<void>;
  };

  // ── 단말 설정 ──
  getNotificationSettings(): Promise<NotificationSettings>;
  saveNotificationSettings(next: NotificationSettings): Promise<Result<NotificationSettings>>;

  // ── 운영 (운영자만. 서버 함수가 admins 테이블로 다시 확인한다) ──
  listReports(status: 'open' | 'done'): Promise<ReportCase[]>;
  getReport(id: string): Promise<ReportCase | null>;
  actOnReport(id: string, req: ModRequest): Promise<Result<ReportCase>>;
  listModLog(): Promise<ModAction[]>;
  listSanctions(): Promise<Sanction[]>;
  liftSanction(id: string, memo: string): Promise<Result<Sanction>>;

  // ── 대화 ──
  /** 지금 열려 있는 장소 채널(사람 수에 맞춰 서버가 연다)과 내 1:1 방. */
  listRooms(): Promise<Room[]>;
  getRoom(id: string): Promise<Room | null>;
  /** 차단한 사람의 말은 서버가 빼고 준다. */
  listMessages(roomId: string): Promise<Message[]>;
  sendMessage(input: { roomId: string; speakerId: string; text: string; owner: boolean }): Promise<Result<Message>>;
  /** 보낸 직후(2분) 다른 캐릭터로 잘못 보낸 말을 바로잡는다. */
  changeSpeaker(messageId: string, speakerId: string): Promise<Result<Message>>;
  deleteMessage(messageId: string): Promise<Result<void>>;
  report(input: { messageId?: string; part?: ReportPart; personaId: string; reason: ReportReason; memo: string }): Promise<Result<void>>;
  block(personaId: string): Promise<Result<void>>;
  unblock(personaId: string): Promise<Result<void>>;
  listInbox(): Promise<InboxItem[]>;
  /** 말 걸기: 내 캐릭터와 상대 캐릭터의 1:1 방을 열거나 이미 있으면 그 방을 준다. */
  openDm(myId: string, otherId: string): Promise<Result<string>>;
  getPersona(id: string): Promise<Persona | null>;
  /** 방마다 마지막으로 말한 내 캐릭터. 다시 열면 그 캐릭터로 시작한다. */
  getLastSpeaker(roomId: string): Promise<string | null>;
  setLastSpeaker(roomId: string, characterId: string): Promise<void>;

  // ── 판독지, 관계, 명부 ──
  /** 남의 판독지면 주인이 숨긴 칸(측정치, 숨긴 선택 기록)은 서버가 빼고 준다. */
  getDossier(characterId: string): Promise<Dossier | null>;
  setStatsHidden(characterId: string, hidden: boolean): Promise<Result<void>>;
  setChoiceHidden(characterId: string, choiceId: string, hidden: boolean): Promise<Result<void>>;
  listActivity(characterId: string): Promise<Activity[]>;
  /** 이름으로 찾기와 역할 거르기만. 능력치나 인기로 줄 세우지 않는다. */
  listDirectory(q: { text: string; role: Role | null }): Promise<DirectoryEntry[]>;
  /** 같은 계정끼리(자관)는 동의 없이 바로 이어진다 (instant). */
  requestRelation(input: { fromId: string; toId: string; kind: RelKind; note: string }): Promise<Result<{ instant: boolean }>>;
  listRelationRequests(): Promise<RelationRequest[]>;
  answerRelationRequest(id: string, accept: boolean): Promise<Result<void>>;
}

/** 대화 쪽 호출 이름. 가짜 구현을 두 파일로 나눠 두려고 쓴다. */
export type TalkKeys =
  | 'listRooms'
  | 'getRoom'
  | 'listMessages'
  | 'sendMessage'
  | 'changeSpeaker'
  | 'deleteMessage'
  | 'block'
  | 'unblock'
  | 'listInbox'
  | 'openDm'
  | 'getPersona'
  | 'getLastSpeaker'
  | 'setLastSpeaker';

/** 운영 쪽 호출 이름. 신고 받기(report)도 운영 가짜 서버가 맡는다. */
export type AdminKeys = 'report' | 'listReports' | 'getReport' | 'actOnReport' | 'listModLog' | 'listSanctions' | 'liftSanction';

/** 하루 한 바퀴 쪽 호출 이름. */
export type DayKeys =
  | 'getSendOptions'
  | 'startSend'
  | 'listMySends'
  | 'listConditions'
  | 'getCondition'
  | 'getFork'
  | 'chooseFork'
  | 'getSendResult'
  | 'pushSend'
  | 'getRestOptions'
  | 'startRest'
  | 'dev';

/** 판독지·관계·명부 쪽 호출 이름. */
export type DossierKeys =
  | 'getDossier'
  | 'setStatsHidden'
  | 'setChoiceHidden'
  | 'listActivity'
  | 'listDirectory'
  | 'requestRelation'
  | 'listRelationRequests'
  | 'answerRelationRequest';
