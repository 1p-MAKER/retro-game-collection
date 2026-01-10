import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'ja' | 'ja-kana';

export interface RankingEntry {
  name: string;
  score: number;
}

export interface GameProgress {
  gameId: string;
  unlockedStages: number; // 0-indexed, or max stage cleared
  rankings: RankingEntry[]; // Top 5 scores with names
}

export interface AppState {
  language: Language;
  soundEnabled: boolean;
  bgmEnabled: boolean;
  playTimeLimitMin: number; // 15, 30, 60, or 0 (unlimited)
  parentalCode: string; // Simple check for now

  gamesProgress: Record<string, GameProgress>;

  setLanguage: (lang: Language) => void;
  toggleSound: () => void;
  toggleBgm: () => void;
  setPlayTimeLimit: (minutes: number) => void;
  updateGameProgress: (gameId: string, stage: number, score: number, name?: string) => void;
  resetAllData: () => void;
}

export const useGameStore = create<AppState>()(
  persist(
    (set) => ({
      language: 'ja',
      soundEnabled: true,
      bgmEnabled: true,
      playTimeLimitMin: 0,
      parentalCode: '9999', // Default placeholder
      gamesProgress: {},

      setLanguage: (lang) => set({ language: lang }),
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      toggleBgm: () => set((state) => ({ bgmEnabled: !state.bgmEnabled })),
      setPlayTimeLimit: (minutes) => set({ playTimeLimitMin: minutes }),

      updateGameProgress: (gameId, stage, score, name = 'YOU') => set((state) => {
        const currentProgress = state.gamesProgress[gameId] || { gameId, unlockedStages: 1, rankings: [] };
        // Update unlocked stages (max)
        const newUnlocked = Math.max(currentProgress.unlockedStages, stage + 1);

        // Update Rankings (keep top 5)
        // If score is high enough to enter
        const newEntry = { name, score };
        const newRankings = [...(currentProgress.rankings || []), newEntry]
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        return {
          gamesProgress: {
            ...state.gamesProgress,
            [gameId]: {
              ...currentProgress,
              unlockedStages: newUnlocked,
              rankings: newRankings
            }
          }
        };
      }),

      resetAllData: () => set({ gamesProgress: {} }),
    }),
    {
      name: 'retro-game-collection-storage',
    }
  )
);
