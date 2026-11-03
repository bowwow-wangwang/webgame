import { mockService } from './mock';
import { mockTalk } from './mockTalk';
import { mockDossier } from './mockDossier';
import { mockDay } from './mockDay';
import { mockAdmin } from './mockAdmin';
import type { GameService } from './types';

// Supabase 구현이 생기면 여기서 바꿔 끼운다. 화면은 이 파일만 가져다 쓴다.
export const api: GameService = { ...mockService, ...mockTalk, ...mockDossier, ...mockDay, ...mockAdmin };
export type { GameService };
