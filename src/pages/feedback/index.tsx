import React, { useState, useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import FeedbackCard from '@/components/FeedbackCard';
import { useAppStore } from '@/store/useAppStore';
import classnames from 'classnames';
import styles from './index.module.scss';

const FeedbackPage = () => {
  const { feedbacks } = useAppStore();
  const [activeTab, setActiveTab] = useState<'hosted' | 'joined'>('hosted');

  const hostedFeedbacks = useMemo(() => {
    return feedbacks.filter((fb) => fb.gameSession.isHost);
  }, [feedbacks]);

  const joinedFeedbacks = useMemo(() => {
    return feedbacks.filter((fb) => !fb.gameSession.isHost);
  }, [feedbacks]);

  return (
    <View className={styles.page}>
      <Text className={styles.pageTitle}>上车反馈</Text>
      <Text className={styles.pageDesc}>结构化反馈，告别零散聊天记录</Text>

      <View className={styles.tabBar}>
        <View
          className={classnames(styles.tab, activeTab === 'hosted' && styles.tabActive)}
          onClick={() => setActiveTab('hosted')}
        >
          <Text>我发起的</Text>
        </View>
        <View
          className={classnames(styles.tab, activeTab === 'joined' && styles.tabActive)}
          onClick={() => setActiveTab('joined')}
        >
          <Text>我响应的</Text>
        </View>
      </View>

      {activeTab === 'hosted' && (
        <View>
          {hostedFeedbacks.length > 0 ? (
            hostedFeedbacks.map((fb) => <FeedbackCard key={fb.gameSessionId} feedback={fb} />)
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📋</Text>
              <Text className={styles.emptyText}>还没发起过车局</Text>
            </View>
          )}
        </View>
      )}

      {activeTab === 'joined' && (
        <View>
          {joinedFeedbacks.length > 0 ? (
            joinedFeedbacks.map((fb) => <FeedbackCard key={fb.gameSessionId} feedback={fb} />)
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>🤷</Text>
              <Text className={styles.emptyText}>还没响应过车局</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default FeedbackPage;
