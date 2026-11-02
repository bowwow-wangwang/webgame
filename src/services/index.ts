import { mockService } from './mock';
import type { GameService } from './types';

// Supabase 구현이 생기면 여기서 바꿔 끼운다. 화면은 이 파일만 가져다 쓴다.
export const api: GameService = mockService;
export type { GameService };
