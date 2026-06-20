import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type {
  UserAvailability,
  GameSession,
  FeedbackItem,
  GameResponse,
  ResponseType,
  GameResponseRecord,
  MatchReason,
  GenreType,
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

const DEFAULT_GAME_RESPONSES: Record<string, GameResponseRecord> = {
  g2: { responseType: 'join', message: '', timestamp: '3天前' },
  g5: { responseType: 'backup', message: '', timestamp: '2天前' },
  g7: { responseType: 'reschedule', message: '周日全天可以', timestamp: '1天前' },
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
    console.error('[Store] read availability cache failed:', e);
  }
  return DEFAULT_AVAILABILITY;
}

function saveAvailability(data: UserAvailability) {
  try {
    Taro.setStorageSync(STORAGE_KEY_AVAILABILITY, JSON.stringify(data));
  } catch (e) {
    console.error('[Store] save availability cache failed:', e);
  }
}

function loadGameResponses(): Record<string, GameResponseRecord> {
  const merged = { ...DEFAULT_GAME_RESPONSES };
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY_RESPONSES);
    if (raw) {
      const stored = JSON.parse(raw);
      Object.entries(stored).forEach(([k, v]) => {
        merged[k] = v as GameResponseRecord;
      });
    }
  } catch (e) {
    console.error('[Store] read responses cache failed:', e);
  }
  return merged;
}

function saveGameResponses(data: Record<string, GameResponseRecord>) {
  try {
    Taro.setStorageSync(STORAGE_KEY_RESPONSES, JSON.stringify(data));
  } catch (e) {
    console.error('[Store] save responses cache failed:', e);
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

function detectDealBreaker(genre: GenreType, dealBreakers: string): { hit: boolean; label?: string } {
  if (!dealBreakers) return { hit: false };
  const db = dealBreakers.toLowerCase();
  if (genre === '恐怖' && (db.includes('恐怖') || db.includes('不玩恐怖') || db.includes('怕恐怖'))) {
    return { hit: true, label: '恐怖本' };
  }
  if (db.includes('不反串') || db.includes('不要反串') || db.includes('别反串')) {
    return { hit: false };
  }
  if (db.includes('不玩') && db.includes(genre)) {
    return { hit: true, label: genre + '本' };
  }
  return { hit: false };
}

function computeMatchInfo(
  game: GameSession,
  availability: UserAvailability
): { score: number; reasons: MatchReason[] } {
  const reasons: MatchReason[] = [];
  let score = 0;

  const timeMatch = checkTimeMatch(game.dateTime, availability.selectedSlots);
  if (timeMatch === 'match') {
    score += 3;
    reasons.push({ type: 'good', icon: '✓', text: '时间正好落在你的空档' });
  } else if (timeMatch === 'mismatch') {
    score -= 1;
    reasons.push({ type: 'bad', icon: '✗', text: '时间不在你的空档' });
  }

  const prefHit = availability.preferences.includes(game.genre);
  if (prefHit) {
    score += 2;
    reasons.push({ type: 'good', icon: '🎯', text: `偏好命中「${game.genre}」` });
  }

  const dealBreaker = detectDealBreaker(game.genre, availability.dealBreakers);
  if (dealBreaker.hit) {
    score -= 5;
    reasons.push({ type: 'bad', icon: '💥', text: `踩雷点：${dealBreaker.label}` });
  }

  if (!game.venueConfirmed) {
    reasons.push({ type: 'warn', icon: '📌', text: '店铺还没定' });
  } else {
    reasons.push({ type: 'good', icon: '📍', text: `店铺已确认：${game.venueName}` });
  }

  const needPlayers = game.maxPlayers - game.currentPlayers;
  if (needPlayers <= 2) {
    score += 1;
    reasons.push({ type: 'warn', icon: '🔥', text: `快要齐人了，还差${needPlayers}位` });
  }

  return { score, reasons };
}

function applyMatchInfo(games: GameSession[], availability: UserAvailability): GameSession[] {
  return games.map((g) => {
    const { score, reasons } = computeMatchInfo(g, availability);
    const timeMatch = checkTimeMatch(g.dateTime, availability.selectedSlots);
    return { ...g, matchScore: score, matchReasons: reasons, timeMatch };
  });
}

function applyGameResponses(
  games: GameSession[],
  responses: Record<string, GameResponseRecord>,
  availability: UserAvailability
): GameSession[] {
  return applyMatchInfo(
    games.map((g) => {
      const resp = responses[g.id];
      return {
        ...g,
        myResponse: resp?.responseType,
        myResponseMessage: resp?.message,
      };
    }),
    availability
  );
}

function buildFeedbacks(
  baseFeedbacks: FeedbackItem[],
  games: GameSession[],
  responses: Record<string, GameResponseRecord>,
  availability: UserAvailability
): FeedbackItem[] {
  const hostedFeedbackMap = new Map<string, FeedbackItem>();
  baseFeedbacks
    .filter((fb) => fb.gameSession.isHost)
    .forEach((fb) => hostedFeedbackMap.set(fb.gameSessionId, fb));

  const hostedResults: FeedbackItem[] = Array.from(hostedFeedbackMap.values()).map((fb) => {
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

  const joinedResults: FeedbackItem[] = [];
  Object.entries(responses).forEach(([gameId, record]) => {
    if (hostedFeedbackMap.has(gameId)) return;
    const game = games.find((g) => g.id === gameId);
    if (!game || game.isHost) return;

    const { score, reasons } = computeMatchInfo(game, availability);
    const sessionWithMatch: GameSession = {
      ...game,
      matchScore: score,
      matchReasons: reasons,
    };

    const myResponseEntry: GameResponse = {
      playerId: MY_ID,
      playerName: MY_NAME,
      playerAvatar: MY_AVATAR,
      responseType: record.responseType,
      message: record.message || '',
      timestamp: record.timestamp || '刚刚',
    };

    joinedResults.push({
      gameSessionId: gameId,
      gameSession: sessionWithMatch,
      responses: [myResponseEntry],
    });
  });

  return [...hostedResults, ...joinedResults];
}

const initialGameResponses = loadGameResponses();
const initialAvailability = loadAvailability();
const initialGames = applyGameResponses(mockGames, initialGameResponses, initialAvailability);
const initialFeedbacks = buildFeedbacks(mockFeedback, mockGames, initialGameResponses, initialAvailability);

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
    const newFeedbacks = buildFeedbacks(mockFeedback, mockGames, state.gameResponses, newAvailability);
    set({ availability: newAvailability, games: newGames, feedbacks: newFeedbacks });
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
    const newFeedbacks = buildFeedbacks(mockFeedback, mockGames, state.gameResponses, newAvailability);
    set({ availability: newAvailability, games: newGames, feedbacks: newFeedbacks });
  },

  togglePreference: (genre) => {
    const state = get();
    const prefs = state.availability.preferences;
    const newPrefs = prefs.includes(genre as any)
      ? prefs.filter((p) => p !== genre)
      : [...prefs, genre as any];
    const newAvailability = { ...state.availability, preferences: newPrefs };
    saveAvailability(newAvailability);
    const newGames = applyGameResponses(mockGames, state.gameResponses, newAvailability);
    const newFeedbacks = buildFeedbacks(mockFeedback, mockGames, state.gameResponses, newAvailability);
    set({ availability: newAvailability, games: newGames, feedbacks: newFeedbacks });
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
    const newFeedbacks = buildFeedbacks(mockFeedback, mockGames, newGameResponses, state.availability);

    set({
      games: newGames,
      feedbacks: newFeedbacks,
      gameResponses: newGameResponses,
    });
  },
}));
