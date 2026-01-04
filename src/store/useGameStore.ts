import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'ja' | 'ja-kana';

export interface GameProgress {
  gameId: string;
  unlockedStages: number; // 0-indexed, or max stage cleared
  highScores: number[]; // Top 5 scores
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
  updateGameProgress: (gameId: string, stage: number, score: number) => void;
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
      
      updateGameProgress: (gameId, stage, score) => set((state) => {
        const currentProgress = state.gamesProgress[gameId] || { gameId, unlockedStages: 1, highScores: [] };
        // Update unlocked stages (max)
        const newUnlocked = Math.max(currentProgress.unlockedStages, stage + 1);
        
        // Update High Scores (keep top 5)
        const newScores = [...currentProgress.highScores, score]
          .sort((a, b) => b - a)
          .slice(0, 5);

        return {
          gamesProgress: {
            ...state.gamesProgress,
            [gameId]: {
              ...currentProgress,
              unlockedStages: newUnlocked,
              highScores: newScores
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
