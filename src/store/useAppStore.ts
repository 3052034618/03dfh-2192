import { create } from 'zustand';
import type { UserAvailability, GameSession, FeedbackItem, ResponseType } from '@/types';
import { mockGames } from '@/data/games';
import { mockFeedback } from '@/data/feedback';

interface AppState {
  availability: UserAvailability;
  games: GameSession[];
  feedbacks: FeedbackItem[];
  setAvailability: (data: Partial<UserAvailability>) => void;
  toggleSlot: (slotId: string) => void;
  togglePreference: (genre: string) => void;
  respondToGame: (gameId: string, response: ResponseType | undefined) => void;
}

export const useAppStore = create<AppState>((set) => ({
  availability: {
    selectedSlots: ['mon-eve', 'wed-eve', 'fri-eve', 'sat-aft', 'sun-aft'],
    preferences: ['情感', '欢乐'],
    dealBreakers: '不玩恐怖本、不反串',
  },
  games: mockGames,
  feedbacks: mockFeedback,

  setAvailability: (data) =>
    set((state) => ({
      availability: { ...state.availability, ...data },
    })),

  toggleSlot: (slotId) =>
    set((state) => {
      const slots = state.availability.selectedSlots;
      const newSlots = slots.includes(slotId)
        ? slots.filter((s) => s !== slotId)
        : [...slots, slotId];
      return {
        availability: { ...state.availability, selectedSlots: newSlots },
      };
    }),

  togglePreference: (genre) =>
    set((state) => {
      const prefs = state.availability.preferences;
      const newPrefs = prefs.includes(genre as any)
        ? prefs.filter((p) => p !== genre)
        : [...prefs, genre as any];
      return {
        availability: { ...state.availability, preferences: newPrefs },
      };
    }),

  respondToGame: (gameId, response) =>
    set((state) => ({
      games: state.games.map((g) =>
        g.id === gameId ? { ...g, myResponse: response } : g
      ),
    })),
}));
