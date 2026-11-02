import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
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
