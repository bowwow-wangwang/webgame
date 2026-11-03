import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './styles/system.css';
import './styles/app.css';
import { App } from './App';
import { applyMotion, loadMotion } from './lib/motion';

applyMotion(loadMotion());

// 새 판이 나오면 다음에 열 때 바뀐다. 쓰던 글이 날아가지 않게 강제로 새로고침하지 않는다.
registerSW({ immediate: true });

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
