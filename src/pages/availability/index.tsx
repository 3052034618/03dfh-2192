import React, { useState } from 'react';
import { View, Text, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import TimeSlotGrid from '@/components/TimeSlotGrid';
import TagGroup from '@/components/TagGroup';
import { weekTimeSlots, genreOptions } from '@/data/availability';
import { useAppStore } from '@/store/useAppStore';
import classnames from 'classnames';
import styles from './index.module.scss';

const AvailabilityPage = () => {
  const { availability, toggleSlot, togglePreference, setAvailability } = useAppStore();
  const [showSaved, setShowSaved] = useState(false);

  const handleSave = () => {
    console.info('[Availability] 保存空档:', availability);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 1500);
    Taro.showToast({ title: '空档已保存', icon: 'success', duration: 1500 });
  };

  return (
    <View className={styles.page}>
      <Text className={styles.pageTitle}>我的空档</Text>
      <Text className={styles.pageDesc}>勾选你有空的时间段，让朋友知道你什么时候可以约</Text>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          本周空档
          <Text className={styles.sectionHint}>点选可玩时间</Text>
        </Text>
        <TimeSlotGrid
          slots={weekTimeSlots}
          selectedSlots={availability.selectedSlots}
          onToggle={toggleSlot}
        />
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          想玩什么
          <Text className={styles.sectionHint}>可多选</Text>
        </Text>
        <TagGroup
          tags={[...genreOptions]}
          selectedTags={availability.preferences}
          onToggle={togglePreference}
        />
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          我的雷点
          <Text className={styles.sectionHint}>如：不玩恐怖、不反串</Text>
        </Text>
        <Textarea
          className={styles.dealBreakerInput}
          placeholder="写明不想碰的类型或玩法..."
          value={availability.dealBreakers}
          onInput={(e) => setAvailability({ dealBreakers: e.detail.value })}
          maxlength={100}
        />
      </View>

      <View className={styles.saveBar}>
        <View className={styles.saveBtn} onClick={handleSave}>
          <Text className={styles.saveBtnText}>保存空档</Text>
        </View>
      </View>

      <View className={classnames(styles.savedTip, showSaved && styles.visible)}>
        已保存 ✓
      </View>
    </View>
  );
};

export default AvailabilityPage;
