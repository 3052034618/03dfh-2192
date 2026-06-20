import React from 'react';
import { View, Text } from '@tarojs/components';
import type { TimeSlot } from '@/types';
import classnames from 'classnames';
import styles from './index.module.scss';

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedSlots: string[];
  onToggle: (slotId: string) => void;
}

const TimeSlotGrid: React.FC<TimeSlotGridProps> = ({ slots, selectedSlots, onToggle }) => {
  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  const getSlotForDay = (day: string, period: string) => {
    return slots.find((s) => s.day === day && s.period === period);
  };

  return (
    <View className={styles.grid}>
      <View className={styles.header}>
        <View className={styles.headerLabel} />
        <View className={styles.headerCols}>
          <View className={styles.headerCol}>下午</View>
          <View className={styles.headerCol}>晚上</View>
        </View>
      </View>
      {weekDays.map((day) => {
        const aftSlot = getSlotForDay(day, 'afternoon');
        const eveSlot = getSlotForDay(day, 'evening');
        const isWeekend = day === '周六' || day === '周日';

        return (
          <View className={styles.row} key={day}>
            <View className={classnames(styles.dayLabel, isWeekend && styles.weekend)}>
              {day}
            </View>
            <View className={styles.slotCols}>
              <View
                className={classnames(
                  styles.slot,
                  aftSlot && selectedSlots.includes(aftSlot.id) && styles.slotActive,
                  !aftSlot && styles.slotDisabled
                )}
                onClick={() => aftSlot && onToggle(aftSlot.id)}
              >
                {aftSlot ? (
                  selectedSlots.includes(aftSlot.id) ? '✓' : ''
                ) : (
                  <Text className={styles.slotDash}>—</Text>
                )}
              </View>
              <View
                className={classnames(
                  styles.slot,
                  eveSlot && selectedSlots.includes(eveSlot.id) && styles.slotActive
                )}
                onClick={() => eveSlot && onToggle(eveSlot.id)}
              >
                {selectedSlots.includes(eveSlot?.id || '') ? '✓' : ''}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default TimeSlotGrid;
