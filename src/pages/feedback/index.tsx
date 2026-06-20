import React, { useState, useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import FeedbackCard from '@/components/FeedbackCard';
import { useAppStore } from '@/store/useAppStore';
import classnames from 'classnames';
import styles from './index.module.scss';

const FeedbackPage = () => {
  const { games, feedbacks } = useAppStore();
  const [activeTab, setActiveTab] = useState<'hosted' | 'joined'>('hosted');

  const myResponses = useMemo(() => {
    return games.filter((g) => g.myResponse);
  }, [games]);

  const statusLabel: Record<string, string> = {
    join: '已上车',
    reschedule: '想换时间',
    backup: '备选',
  };

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
          {feedbacks.length > 0 ? (
            feedbacks.map((fb) => <FeedbackCard key={fb.gameSessionId} feedback={fb} />)
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
          {myResponses.length > 0 ? (
            myResponses.map((game) => (
              <View className={styles.myResponseCard} key={game.id}>
                <View className={styles.responseInfo}>
                  <Text className={styles.responseGameName}>{game.gameName}</Text>
                  <Text className={styles.responseMeta}>
                    {game.hostName}发起 · {game.dateTime}
                  </Text>
                </View>
                <View
                  className={classnames(
                    styles.responseStatus,
                    game.myResponse === 'join' && styles.statusJoin,
                    game.myResponse === 'reschedule' && styles.statusReschedule,
                    game.myResponse === 'backup' && styles.statusBackup
                  )}
                >
                  <Text className={styles.statusText}>{statusLabel[game.myResponse!]}</Text>
                </View>
              </View>
            ))
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
