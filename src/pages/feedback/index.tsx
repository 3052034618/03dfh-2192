import React, { useState, useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import FeedbackCard from '@/components/FeedbackCard';
import { useAppStore } from '@/store/useAppStore';
import type { ResponseType, GameSession } from '@/types';
import classnames from 'classnames';
import styles from './index.module.scss';

const statusLabel: Record<ResponseType, string> = {
  join: '已上车',
  reschedule: '想换时间',
  backup: '备选',
};

const statusGroups: { key: ResponseType; label: string; icon: string }[] = [
  { key: 'join', label: '已上车', icon: '✓' },
  { key: 'reschedule', label: '想换时间', icon: '⏰' },
  { key: 'backup', label: '备选', icon: '📋' },
];

interface PendingItem {
  game: GameSession;
  tagText: string;
  tagType: 'urgent' | 'timeconflict' | 'highmatch';
}

const FeedbackPage = () => {
  const { feedbacks, games, gameResponses } = useAppStore();
  const [activeTab, setActiveTab] = useState<'hosted' | 'joined'>('hosted');

  const hostedFeedbacks = useMemo(() => {
    return feedbacks.filter((fb) => fb.gameSession.isHost);
  }, [feedbacks]);

  const joinedRecords = useMemo(() => {
    const entries = Object.entries(gameResponses);
    return entries
      .map(([gameId, record]) => {
        const game = games.find((g) => g.id === gameId);
        if (!game || game.isHost) return null;
        return {
          game,
          responseType: record.responseType,
          message: record.message,
          timestamp: record.timestamp,
        };
      })
      .filter(Boolean) as Array<{
      game: GameSession;
      responseType: ResponseType;
      message: string;
      timestamp: string;
    }>;
  }, [games, gameResponses]);

  const groupedRecords = useMemo(() => {
    const groups: Record<ResponseType, typeof joinedRecords> = {
      join: [],
      reschedule: [],
      backup: [],
    };
    joinedRecords.forEach((r) => {
      groups[r.responseType].push(r);
    });
    return groups;
  }, [joinedRecords]);

  const pendingItems = useMemo((): PendingItem[] => {
    const items: PendingItem[] = [];
    games.forEach((g) => {
      if (g.isHost || g.myResponse) return;
      const needPlayers = g.maxPlayers - g.currentPlayers;
      const hasConflict = g.timeMatch === 'mismatch';
      const highMatch = g.matchScore >= 4;

      if (needPlayers <= 2) {
        items.push({ game: g, tagText: `差${needPlayers}人快齐了`, tagType: 'urgent' });
      } else if (hasConflict) {
        items.push({ game: g, tagText: '时间有冲突', tagType: 'timeconflict' });
      } else if (highMatch) {
        items.push({ game: g, tagText: '非常适配你的偏好', tagType: 'highmatch' });
      }
    });
    return items;
  }, [games]);

  const handleJumpToGame = (gameId: string) => {
    Taro.switchTab({
      url: '/pages/garage/index',
      success: () => {
        Taro.eventCenter.trigger('scrollToGame', gameId);
      },
    });
  };

  return (
    <View className={styles.page}>
      <Text className={styles.pageTitle}>上车反馈</Text>
      <Text className={styles.pageDesc}>结构化反馈，告别零散聊天记录</Text>

      {pendingItems.length > 0 && (
        <View className={styles.pendingCard}>
          <View className={styles.pendingHeader}>
            <Text className={styles.pendingTitle}>🔔 待我决定</Text>
            <View className={styles.pendingCountBadge}>
              <Text className={styles.pendingCountText}>{pendingItems.length}</Text>
            </View>
          </View>
          <View className={styles.pendingList}>
            {pendingItems.map((item) => (
              <View
                key={item.game.id}
                className={styles.pendingItem}
                onClick={() => handleJumpToGame(item.game.id)}
              >
                <View className={styles.pendingItemLeft}>
                  <View className={styles.pendingGameName}>{item.game.gameName}</View>
                  <View className={styles.pendingGameMeta}>
                    {item.game.hostName} · {item.game.dateTime}
                  </View>
                </View>
                <View className={styles.pendingItemRight}>
                  <View
                    className={classnames(
                      styles.pendingTag,
                      item.tagType === 'urgent' && styles.pendingTagUrgent,
                      item.tagType === 'timeconflict' && styles.pendingTagConflict,
                      item.tagType === 'highmatch' && styles.pendingTagHigh
                    )}
                  >
                    <Text className={styles.pendingTagText}>{item.tagText}</Text>
                  </View>
                  <Text className={styles.pendingArrow}>›</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

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
          {joinedRecords.length > 0 ? (
            statusGroups.map((group) => {
              const items = groupedRecords[group.key];
              if (items.length === 0) return null;
              return (
                <View key={group.key} className={styles.recordGroup}>
                  <View className={styles.recordGroupHeader}>
                    <Text className={styles.recordGroupIcon}>{group.icon}</Text>
                    <Text
                      className={classnames(
                        styles.recordGroupTitle,
                        styles[`title${group.key}`]
                      )}
                    >
                      {group.label}
                    </Text>
                    <View
                      className={classnames(
                        styles.recordGroupCount,
                        styles[`count${group.key}`]
                      )}
                    >
                      <Text className={styles.recordGroupCountText}>{items.length}</Text>
                    </View>
                  </View>
                  <View className={styles.recordList}>
                    {items.map((item) => (
                      <View key={item.game.id} className={styles.recordCard}>
                        <View className={styles.recordTop}>
                          <Text className={styles.recordGameName}>{item.game.gameName}</Text>
                          <View
                            className={classnames(
                              styles.recordStatus,
                              styles[`status${item.responseType}`]
                            )}
                          >
                            <Text className={styles.recordStatusText}>
                              {statusLabel[item.responseType]}
                            </Text>
                          </View>
                        </View>
                        <View className={styles.recordMeta}>
                          <View className={styles.recordMetaItem}>
                            <Text className={styles.recordMetaIcon}>👤</Text>
                            <Text className={styles.recordMetaText}>车头：{item.game.hostName}</Text>
                          </View>
                          <View className={styles.recordMetaItem}>
                            <Text className={styles.recordMetaIcon}>🕐</Text>
                            <Text className={styles.recordMetaText}>{item.game.dateTime}</Text>
                          </View>
                          <View className={styles.recordMetaItem}>
                            <Text className={styles.recordMetaIcon}>📍</Text>
                            <Text className={styles.recordMetaText}>
                              {item.game.venueConfirmed ? item.game.venueName : '待定店铺'}
                            </Text>
                          </View>
                          {item.message && (
                            <View className={styles.recordMessage}>
                              <Text className={styles.recordMessageLabel}>换时间说明：</Text>
                              <Text className={styles.recordMessageText}>{item.message}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })
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
