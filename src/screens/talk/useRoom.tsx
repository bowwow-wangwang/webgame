import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useSession } from '../../lib/session';
import { api } from '../../services';
import type { Message, Persona, Room } from '../../types/domain';
import { ReportSheet, SpeakerSheet, type MsgAction } from '../../ui/chat/Chat';
import { useToast } from '../../ui/Toast';

/**
 * 대화방 하나의 상태: 말 목록, 지금 말하는 캐릭터(방마다 기억), 보내기, 말마다의 행동.
 * 장소 채널, 1:1 대화, 상황판에 끼운 채널이 함께 쓴다.
 */
export function useRoom(roomId: string | undefined) {
  const { characters } = useSession();
  const toast = useToast();
  const nav = useNavigate();
  const [room, setRoom] = useState<Room | null | undefined>(undefined);
  const [messages, setMessages] = useState<Message[]>([]);
  const [speakerId, setSpeakerId] = useState<string | undefined>(undefined);
  const [owner, setOwner] = useState(false);
  const [sheet, setSheet] = useState<null | { kind: 'speaker'; message?: Message } | { kind: 'report'; message: Message }>(null);

  const mine: Persona[] = useMemo(
    () => characters.map((c) => ({ id: c.id, name: c.name, role: c.role, portraitUrl: c.portraitUrl, mine: true })),
    [characters],
  );

  const reload = useCallback(async () => {
    if (!roomId) return;
    const [r, ms] = await Promise.all([api.getRoom(roomId), api.listMessages(roomId)]);
    setRoom(r);
    setMessages(ms);
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    setRoom(undefined);
    void reload();
    // 방마다 마지막으로 말한 캐릭터로 연다. 처음이면 1:1은 상대가 말을 건 내 캐릭터, 장소는 첫 캐릭터.
    void api.getLastSpeaker(roomId).then((last) => setSpeakerId((cur) => last ?? cur));
  }, [roomId, reload]);

  useEffect(() => {
    if (!room || speakerId) return;
    const inDm = room.members?.find((m) => m.mine)?.id;
    setSpeakerId(inDm ?? mine[0]?.id);
  }, [room, speakerId, mine]);

  const speaker = mine.find((m) => m.id === speakerId) ?? mine[0];

  async function send(text: string) {
    if (!roomId || !speaker) return false;
    const r = await api.sendMessage({ roomId, speakerId: speaker.id, text, owner });
    if (!r.ok) {
      toast({ kind: 'danger', text: r.message });
      return false;
    }
    setMessages((ms) => [...ms, r.value]);
    return true;
  }

  function pickSpeaker(id: string) {
    setSpeakerId(id);
    if (roomId) void api.setLastSpeaker(roomId, id);
  }

  async function act(a: MsgAction) {
    if (a.type === 'report') return setSheet({ kind: 'report', message: a.message });
    if (a.type === 'respeak') return setSheet({ kind: 'speaker', message: a.message });
    if (a.type === 'delete') {
      const r = await api.deleteMessage(a.message.id);
      if (!r.ok) return toast({ kind: 'danger', text: r.message });
      setMessages((ms) => ms.filter((m) => m.id !== a.message.id));
      return toast({ kind: 'ok', text: '지웠어요.' });
    }
    if (a.type === 'block') {
      await api.block(a.persona.id);
      await reload();
      return toast({
        kind: 'ok',
        text: `${a.persona.name}의 오너를 차단했어요. 그 사람의 캐릭터는 내 화면에 보이지 않아요.`,
        action: {
          label: '되돌리기',
          run: () => void api.unblock(a.persona.id).then(reload),
        },
      });
    }
    if (a.type === 'talk') {
      if (!speaker) return;
      const r = await api.openDm(speaker.id, a.persona.id);
      if (!r.ok) return toast({ kind: 'danger', text: r.message });
      nav(`/dm/${r.value}`);
    }
  }

  const sheets = (
    <>
      {sheet?.kind === 'speaker' && (
        <SpeakerSheet
          title={sheet.message ? '이 말을 다른 캐릭터로 바꾸기' : '말하는 캐릭터 바꾸기'}
          characters={mine}
          current={sheet.message?.speaker?.id ?? speaker?.id}
          onClose={() => setSheet(null)}
          onPick={async (id) => {
            const msg = sheet.message;
            setSheet(null);
            if (msg) {
              const r = await api.changeSpeaker(msg.id, id);
              if (!r.ok) return toast({ kind: 'danger', text: r.message });
              setMessages((ms) => ms.map((m) => (m.id === msg.id ? r.value : m)));
              toast({ kind: 'ok', text: `${r.value.speaker?.name}의 말로 바꿨어요.` });
            }
            pickSpeaker(id);
          }}
        />
      )}
      {sheet?.kind === 'report' && sheet.message.speaker && (
        <ReportSheet
          target={sheet.message.speaker}
          onClose={() => setSheet(null)}
          onSubmit={async (reason, memo) => {
            const target = sheet.message.speaker;
            setSheet(null);
            if (!target) return;
            const r = await api.report({ messageId: sheet.message.id, personaId: target.id, reason, memo });
            toast(r.ok ? { kind: 'ok', text: '신고를 받았어요. 운영자가 확인해요.' } : { kind: 'danger', text: r.message });
          }}
        />
      )}
    </>
  );

  return {
    room,
    messages,
    mine,
    speaker,
    owner,
    setOwner,
    send,
    act,
    openSpeakerSheet: () => setSheet({ kind: 'speaker' }),
    sheets,
    reload,
  };
}
