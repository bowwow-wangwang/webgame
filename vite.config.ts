import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// 깃허브 페이지는 저장소 이름이 하위 경로가 된다. 개발 서버는 루트에서 돈다.
const BASE = '/webgame/';

export default defineConfig(({ command, isPreview }) => {
  // 빌드 결과를 미리 보는 preview도 깃허브 페이지와 같은 하위 경로로 띄운다.
  const base = command === 'build' || isPreview ? BASE : '/';
  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['icon.svg'],
        manifest: {
          // TODO: 게임 제목이 정해지면 src/config/game.ts의 GAME_TITLE과 함께 바꾼다.
          name: '[게임 제목]',
          short_name: '[게임 제목]',
          description: '휴전 5년차. 캐릭터를 데려와 하루를 보내는 자캐 커뮤니티 웹게임.',
          lang: 'ko',
          start_url: base,
          scope: base,
          display: 'standalone',
          background_color: '#06110A',
          theme_color: '#06110A',
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // 해시 라우팅이라 모든 화면이 index.html 하나에서 열린다.
          navigateFallback: 'index.html',
          globPatterns: ['**/*.{js,css,html,webp,png,woff2,svg}'],
          maximumFileSizeToCacheInBytes: 1_000_000,
        },
      }),
    ],
  };
});
