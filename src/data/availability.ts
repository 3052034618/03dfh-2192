import type { TimeSlot } from '@/types';

export const weekTimeSlots: TimeSlot[] = [
  { id: 'mon-eve', day: '周一', period: 'evening', label: '周一晚' },
  { id: 'tue-eve', day: '周二', period: 'evening', label: '周二晚' },
  { id: 'wed-eve', day: '周三', period: 'evening', label: '周三晚' },
  { id: 'thu-eve', day: '周四', period: 'evening', label: '周四晚' },
  { id: 'fri-eve', day: '周五', period: 'evening', label: '周五晚' },
  { id: 'sat-aft', day: '周六', period: 'afternoon', label: '周六下午' },
  { id: 'sat-eve', day: '周六', period: 'evening', label: '周六晚' },
  { id: 'sun-aft', day: '周日', period: 'afternoon', label: '周日下午' },
  { id: 'sun-eve', day: '周日', period: 'evening', label: '周日晚' },
];

export const genreOptions = ['情感', '机制', '欢乐', '硬核推理', '恐怖', '阵营', '沉浸'] as const;
