import type { ReactNode } from 'react';
import { createHashRouter, Navigate, Outlet, RouterProvider } from 'react-router';
import { SessionProvider, useSession } from './lib/session';
import { Frame } from './shell/Frame';
import { Loading } from './ui/Loading';
import { ToastProvider } from './ui/Toast';
import { JoinScreen, LoginScreen } from './screens/Auth';
import { CreateFlow } from './screens/create/CreateFlow';
import { InstallScreen, RegisteredScreen, SendScreen, SentScreen } from './screens/AfterCreate';
import { RestIndex, RestScreen, ResultScreen, RunScreen, SendHub } from './screens/day/DayScreens';
import { HomeScreen } from './screens/Home';
import { SettingsScreen } from './screens/Settings';
import { DmScreen, PlaceScreen, TalkScreen } from './screens/talk/TalkScreens';
import { DirectoryScreen, DossierScreen, RecordScreen } from './screens/dossier/DossierScreens';

function Booting() {
  return (
    <Frame plate="부팅">
      <Loading text="단말을 켜는 중" />
    </Frame>
  );
}

/** 로그인해야 들어가는 화면. 캐릭터가 하나도 없으면 만들기로 보낸다. */
function RequireSession({ children, needCharacter = true }: { children: ReactNode; needCharacter?: boolean }) {
  const { ready, session, characters } = useSession();
  if (!ready) return <Booting />;
  if (!session) return <Navigate to="/login" replace />;
  if (needCharacter && characters.length === 0) return <Navigate to="/create/1" replace />;
  return children;
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { ready, session } = useSession();
  if (!ready) return <Booting />;
  if (session) return <Navigate to="/" replace />;
  return children;
}

function Start() {
  const { ready, session, characters } = useSession();
  if (!ready) return <Booting />;
  if (!session) return <Navigate to="/login" replace />;
  return <Navigate to={characters.length ? '/home' : '/create/1'} replace />;
}

// 깃허브 페이지에서 새로고침해도 깨지지 않게 해시 주소를 쓴다 (#/home).
const router = createHashRouter([
  {
    element: <Outlet />,
    children: [
      { path: '/', element: <Start /> },
      { path: '/login', element: <GuestOnly><LoginScreen /></GuestOnly> },
      { path: '/join', element: <GuestOnly><JoinScreen /></GuestOnly> },
      { path: '/create', element: <Navigate to="/create/1" replace /> },
      { path: '/create/:step', element: <RequireSession needCharacter={false}><CreateFlow /></RequireSession> },
      { path: '/registered/:id', element: <RequireSession><RegisteredScreen /></RequireSession> },
      { path: '/install', element: <RequireSession><InstallScreen /></RequireSession> },
      { path: '/send', element: <RequireSession><SendHub /></RequireSession> },
      { path: '/run/:id', element: <RequireSession><RunScreen /></RequireSession> },
      { path: '/result/:id', element: <RequireSession><ResultScreen /></RequireSession> },
      { path: '/rest', element: <RequireSession><RestIndex /></RequireSession> },
      { path: '/rest/:id', element: <RequireSession><RestScreen /></RequireSession> },
      { path: '/send/:id', element: <RequireSession><SendScreen /></RequireSession> },
      { path: '/sent/:id', element: <RequireSession><SentScreen /></RequireSession> },
      { path: '/home', element: <RequireSession><HomeScreen /></RequireSession> },
      { path: '/talk', element: <RequireSession><TalkScreen /></RequireSession> },
      { path: '/place/:id', element: <RequireSession><PlaceScreen /></RequireSession> },
      { path: '/dm/:id', element: <RequireSession><DmScreen /></RequireSession> },
      { path: '/record', element: <RequireSession><RecordScreen /></RequireSession> },
      { path: '/directory', element: <RequireSession><DirectoryScreen /></RequireSession> },
      { path: '/dossier/:id', element: <RequireSession><DossierScreen key="p1" page={1} /></RequireSession> },
      { path: '/dossier/:id/log', element: <RequireSession><DossierScreen key="p2" page={2} /></RequireSession> },
      { path: '/settings', element: <RequireSession><SettingsScreen /></RequireSession> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export function App() {
  return (
    <SessionProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </SessionProvider>
  );
}
