export type GenreType = '情感' | '机制' | '欢乐' | '硬核推理' | '恐怖' | '阵营' | '沉浸';

export type DayOfWeek = '周一' | '周二' | '周三' | '周四' | '周五' | '周六' | '周日';

export type TimePeriod = 'evening' | 'afternoon';

export interface TimeSlot {
  id: string;
  day: DayOfWeek;
  period: TimePeriod;
  label: string;
}

export interface UserAvailability {
  selectedSlots: string[];
  preferences: GenreType[];
  dealBreakers: string;
}

export type ResponseType = 'join' | 'reschedule' | 'backup';

export type NameVisibility = 'all' | 'friends' | 'host-only';

export interface GameSession {
  id: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  gameName: string;
  genre: GenreType;
  dateTime: string;
  endTime: string;
  currentPlayers: number;
  maxPlayers: number;
  venueConfirmed: boolean;
  venueName: string;
  nameVisibility: NameVisibility;
  description: string;
  myResponse?: ResponseType;
  isHost: boolean;
}

export interface GameResponse {
  playerId: string;
  playerName: string;
  playerAvatar: string;
  responseType: ResponseType;
  message: string;
  timestamp: string;
}

export interface FeedbackItem {
  gameSessionId: string;
  gameSession: GameSession;
  responses: GameResponse[];
}
