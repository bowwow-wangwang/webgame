import type {
  ActiveSend,
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
}
