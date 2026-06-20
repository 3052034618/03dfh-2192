import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { UserAvailability, GameSession, FeedbackItem, GameResponse, ResponseType } from '@/types';
import { mockGames } from '@/data/games';
import { mockFeedback } from '@/data/feedback';

const STORAGE_KEY_AVAILABILITY = 'yb_availability';
const STORAGE_KEY_RESPONSES = 'yb_game_responses';

const MY_ID = 'me';
const MY_NAME = '我';
const MY_AVATAR = 'https://picsum.photos/id/64/200/200';

const DEFAULT_AVAILABILITY: UserAvailability = {
  selectedSlots: ['mon-eve', 'wed-eve', 'fri-eve', 'sat-aft', 'sun-aft'],
  preferences: ['情感', '欢乐'],
  dealBreakers: '不玩恐怖本、不反串',
};

function loadAvailability(): UserAvailability {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY_AVAILABILITY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        selectedSlots: parsed.selectedSlots || [],
        preferences: parsed.preferences || [],
        dealBreakers: parsed.dealBreakers || '',
      };
    }
  } catch (e) {
    console.error('[Store] 读取空档缓存失败:', e);
  }
  return DEFAULT_AVAILABILITY;
}

function saveAvailability(data: UserAvailability) {
  try {
    Taro.setStorageSync(STORAGE_KEY_AVAILABILITY, JSON.stringify(data));
  } catch (e) {
    console.error('[Store] 保存空档缓存失败:', e);
  }
}

function loadGameResponses(): Record<string, ResponseType> {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY_RESPONSES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('[Store] 读取响应缓存失败:', e);
  }
  return {};
}

function saveGameResponses(data: Record<string, ResponseType>) {
  try {
    Taro.setStorageSync(STORAGE_KEY_RESPONSES, JSON.stringify(data));
  } catch (e) {
    console.error('[Store] 保存响应缓存失败:', e);
  }
}

function applyGameResponses(games: GameSession[], responses: Record<string, ResponseType>): GameSession[] {
  return games.map((g) => {
    const resp = responses[g.id];
    return resp ? { ...g, myResponse: resp } : g;
  });
}

function buildFeedbacks(
  baseFeedbacks: FeedbackItem[],
  games: GameSession[],
  responses: Record<string, ResponseType>
): FeedbackItem[] {
  const result = baseFeedbacks.map((fb) => {
    const myResp = responses[fb.gameSessionId];
    if (!myResp) return fb;

    const existingIdx = fb.responses.findIndex((r) => r.playerId === MY_ID);
    let newResponses: GameResponse[];
    if (existingIdx >= 0) {
      newResponses = fb.responses.map((r, i) =>
        i === existingIdx ? { ...r, responseType: myResp, timestamp: '刚刚' } : r
      );
    } else {
      newResponses = [
        ...fb.responses,
        {
          playerId: MY_ID,
          playerName: MY_NAME,
          playerAvatar: MY_AVATAR,
          responseType: myResp,
          message: '',
          timestamp: '刚刚',
        },
      ];
    }
    return { ...fb, responses: newResponses };
  });

  const coveredIds = new Set(result.map((fb) => fb.gameSessionId));
  Object.entries(responses).forEach(([gameId, responseType]) => {
    if (coveredIds.has(gameId)) return;
    const game = games.find((g) => g.id === gameId);
    if (!game) return;
    result.push({
      gameSessionId: gameId,
      gameSession: { ...game, isHost: false },
      responses: [
        {
          playerId: MY_ID,
          playerName: MY_NAME,
          playerAvatar: MY_AVATAR,
          responseType,
          message: '',
          timestamp: '刚刚',
        },
      ],
    });
  });

  return result;
}

const initialGameResponses = loadGameResponses();
const initialAvailability = loadAvailability();
const initialGames = applyGameResponses(mockGames, initialGameResponses);
const initialFeedbacks = buildFeedbacks(mockFeedback, mockGames, initialGameResponses);

interface AppState {
  availability: UserAvailability;
  games: GameSession[];
  feedbacks: FeedbackItem[];
  gameResponses: Record<string, ResponseType>;
  setAvailability: (data: Partial<UserAvailability>) => void;
  toggleSlot: (slotId: string) => void;
  togglePreference: (genre: string) => void;
  respondToGame: (gameId: string, response: ResponseType) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  availability: initialAvailability,
  games: initialGames,
  feedbacks: initialFeedbacks,
  gameResponses: initialGameResponses,

  setAvailability: (data) => {
    const state = get();
    const newAvailability = { ...state.availability, ...data };
    saveAvailability(newAvailability);
    set({ availability: newAvailability });
  },

  toggleSlot: (slotId) => {
    const state = get();
    const slots = state.availability.selectedSlots;
    const newSlots = slots.includes(slotId)
      ? slots.filter((s) => s !== slotId)
      : [...slots, slotId];
    const newAvailability = { ...state.availability, selectedSlots: newSlots };
    saveAvailability(newAvailability);
    set({ availability: newAvailability });
  },

  togglePreference: (genre) => {
    const state = get();
    const prefs = state.availability.preferences;
    const newPrefs = prefs.includes(genre as any)
      ? prefs.filter((p) => p !== genre)
      : [...prefs, genre as any];
    const newAvailability = { ...state.availability, preferences: newPrefs };
    saveAvailability(newAvailability);
    set({ availability: newAvailability });
  },

  respondToGame: (gameId, response) => {
    const state = get();
    const newGameResponses = { ...state.gameResponses, [gameId]: response };
    saveGameResponses(newGameResponses);

    const newGames = state.games.map((g) =>
      g.id === gameId ? { ...g, myResponse: response } : g
    );

    const newFeedbacks = buildFeedbacks(mockFeedback, mockGames, newGameResponses);

    set({
      games: newGames,
      feedbacks: newFeedbacks,
      gameResponses: newGameResponses,
    });
  },
}));
