import type {
  ActiveSend,
  Activity,
  DirectoryEntry,
  Dossier,
  RelationRequest,
  RelKind,
  Role,
  InboxItem,
  Message,
  Persona,
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
  report(input: { messageId?: string; personaId: string; reason: ReportReason; memo: string }): Promise<Result<void>>;
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
  | 'report'
  | 'block'
  | 'unblock'
  | 'listInbox'
  | 'openDm'
  | 'getPersona'
  | 'getLastSpeaker'
  | 'setLastSpeaker';

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
