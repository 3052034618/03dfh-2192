import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type {
  UserAvailability,
  GameSession,
  FeedbackItem,
  GameResponse,
  ResponseType,
  GameResponseRecord,
} from '@/types';
import { mockGames } from '@/data/games';
import { mockFeedback } from '@/data/feedback';

const STORAGE_KEY_AVAILABILITY = 'yb_availability';
const STORAGE_KEY_RESPONSES = 'yb_game_responses_v2';

const MY_ID = 'me';
const MY_NAME = '我';
const MY_AVATAR = 'https://picsum.photos/id/64/200/200';

const DEFAULT_AVAILABILITY: UserAvailability = {
  selectedSlots: ['mon-eve', 'wed-eve', 'fri-eve', 'sat-aft', 'sun-aft'],
  preferences: ['情感', '欢乐'],
  dealBreakers: '不玩恐怖本、不反串',
};

const dayKeyMap: Record<string, string> = {
  周一: 'mon',
  周二: 'tue',
  周三: 'wed',
  周四: 'thu',
  周五: 'fri',
  周六: 'sat',
  周日: 'sun',
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

function loadGameResponses(): Record<string, GameResponseRecord> {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY_RESPONSES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('[Store] 读取响应缓存失败:', e);
  }
  return {};
}

function saveGameResponses(data: Record<string, GameResponseRecord>) {
  try {
    Taro.setStorageSync(STORAGE_KEY_RESPONSES, JSON.stringify(data));
  } catch (e) {
    console.error('[Store] 保存响应缓存失败:', e);
  }
}

function parseDateTimeSlot(dateTime: string): string | null {
  const match = dateTime.match(/(周[一二三四五六日])\s*(\d{1,2}):\d{2}/);
  if (!match) return null;
  const day = match[1];
  const hour = parseInt(match[2], 10);
  const dayKey = dayKeyMap[day];
  if (!dayKey) return null;
  const period = hour < 17 ? 'aft' : 'eve';
  return `${dayKey}-${period}`;
}

function checkTimeMatch(dateTime: string, selectedSlots: string[]): 'match' | 'mismatch' | 'unknown' {
  const slotId = parseDateTimeSlot(dateTime);
  if (!slotId) return 'unknown';
  return selectedSlots.includes(slotId) ? 'match' : 'mismatch';
}

function applyGameResponses(
  games: GameSession[],
  responses: Record<string, GameResponseRecord>,
  availability: UserAvailability
): GameSession[] {
  return games.map((g) => {
    const resp = responses[g.id];
    const timeMatch = checkTimeMatch(g.dateTime, availability.selectedSlots);
    return {
      ...g,
      myResponse: resp?.responseType,
      myResponseMessage: resp?.message,
      timeMatch,
    };
  });
}

function buildFeedbacks(
  baseFeedbacks: FeedbackItem[],
  games: GameSession[],
  responses: Record<string, GameResponseRecord>
): FeedbackItem[] {
  const hostedGameIds = new Set(
    baseFeedbacks.filter((fb) => fb.gameSession.isHost).map((fb) => fb.gameSessionId)
  );

  const result = baseFeedbacks.map((fb) => {
    const myResp = responses[fb.gameSessionId];
    if (!myResp) return fb;

    const existingIdx = fb.responses.findIndex((r) => r.playerId === MY_ID);
    let newResponses: GameResponse[];
    if (existingIdx >= 0) {
      newResponses = fb.responses.map((r, i) =>
        i === existingIdx
          ? { ...r, responseType: myResp.responseType, message: myResp.message, timestamp: '刚刚' }
          : r
      );
    } else {
      newResponses = [
        ...fb.responses,
        {
          playerId: MY_ID,
          playerName: MY_NAME,
          playerAvatar: MY_AVATAR,
          responseType: myResp.responseType,
          message: myResp.message || '',
          timestamp: '刚刚',
        },
      ];
    }
    return { ...fb, responses: newResponses };
  });

  Object.entries(responses).forEach(([gameId, record]) => {
    if (hostedGameIds.has(gameId)) return;
    const existingFbIdx = result.findIndex((fb) => fb.gameSessionId === gameId);
    const game = games.find((g) => g.id === gameId);
    if (!game) return;

    const sessionData: GameSession = { ...game, isHost: false };

    const myResponseEntry: GameResponse = {
      playerId: MY_ID,
      playerName: MY_NAME,
      playerAvatar: MY_AVATAR,
      responseType: record.responseType,
      message: record.message || '',
      timestamp: '刚刚',
    };

    if (existingFbIdx >= 0) {
      const existing = result[existingFbIdx];
      const respIdx = existing.responses.findIndex((r) => r.playerId === MY_ID);
      let newResponses: GameResponse[];
      if (respIdx >= 0) {
        newResponses = existing.responses.map((r, i) =>
          i === respIdx ? myResponseEntry : r
        );
      } else {
        newResponses = [...existing.responses, myResponseEntry];
      }
      result[existingFbIdx] = { ...existing, responses: newResponses };
    } else {
      result.push({
        gameSessionId: gameId,
        gameSession: sessionData,
        responses: [myResponseEntry],
      });
    }
  });

  return result;
}

const initialGameResponses = loadGameResponses();
const initialAvailability = loadAvailability();
const initialGames = applyGameResponses(mockGames, initialGameResponses, initialAvailability);
const initialFeedbacks = buildFeedbacks(mockFeedback, mockGames, initialGameResponses);

interface AppState {
  availability: UserAvailability;
  games: GameSession[];
  feedbacks: FeedbackItem[];
  gameResponses: Record<string, GameResponseRecord>;
  setAvailability: (data: Partial<UserAvailability>) => void;
  toggleSlot: (slotId: string) => void;
  togglePreference: (genre: string) => void;
  respondToGame: (gameId: string, response: ResponseType, message?: string) => void;
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
    const newGames = applyGameResponses(mockGames, state.gameResponses, newAvailability);
    set({ availability: newAvailability, games: newGames });
  },

  toggleSlot: (slotId) => {
    const state = get();
    const slots = state.availability.selectedSlots;
    const newSlots = slots.includes(slotId)
      ? slots.filter((s) => s !== slotId)
      : [...slots, slotId];
    const newAvailability = { ...state.availability, selectedSlots: newSlots };
    saveAvailability(newAvailability);
    const newGames = applyGameResponses(mockGames, state.gameResponses, newAvailability);
    set({ availability: newAvailability, games: newGames });
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

  respondToGame: (gameId, response, message = '') => {
    const state = get();
    const newRecord: GameResponseRecord = {
      responseType: response,
      message,
      timestamp: '刚刚',
    };
    const newGameResponses = { ...state.gameResponses, [gameId]: newRecord };
    saveGameResponses(newGameResponses);

    const newGames = applyGameResponses(mockGames, newGameResponses, state.availability);
    const newFeedbacks = buildFeedbacks(mockFeedback, mockGames, newGameResponses);

    set({
      games: newGames,
      feedbacks: newFeedbacks,
      gameResponses: newGameResponses,
    });
  },
}));
