import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { applyConfig } from '../config/worldConfig';
import { api } from '../services';
import type { Character, Session } from '../types/domain';

interface SessionState {
  ready: boolean;
  session: Session | null;
  characters: Character[];
  refresh: () => Promise<void>;
}

const Ctx = createContext<SessionState>({ ready: false, session: null, characters: [], refresh: async () => {} });

/** 로그인 상태와 내 캐릭터 목록. 화면마다 다시 묻지 않으려고 한 곳에 둔다. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<SessionState, 'refresh'>>({ ready: false, session: null, characters: [] });
  const refresh = useCallback(async () => {
    // 밸런스 수치는 서버가 정한다. 화면의 미리 보기도 같은 값을 쓰게 먼저 받아 둔다.
    applyConfig(await api.getWorldConfig());
    const session = await api.getSession();
    const characters = session ? await api.listMyCharacters() : [];
    setState({ ready: true, session, characters });
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return <Ctx.Provider value={{ ...state, refresh }}>{children}</Ctx.Provider>;
}

export const useSession = () => useContext(Ctx);
