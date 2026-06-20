import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import classnames from 'classnames';
import type { FeedbackItem } from '@/types';
import styles from './index.module.scss';

interface FeedbackCardProps {
  feedback: FeedbackItem;
}

const FeedbackCard: React.FC<FeedbackCardProps> = ({ feedback }) => {
  const { gameSession, responses } = feedback;
  const joinList = responses.filter((r) => r.responseType === 'join');
  const rescheduleList = responses.filter((r) => r.responseType === 'reschedule');
  const backupList = responses.filter((r) => r.responseType === 'backup');

  return (
    <View className={styles.card}>
      <View className={styles.cardHeader}>
        <View className={styles.gameInfo}>
          <Text className={styles.gameName}>{gameSession.gameName}</Text>
          <Text className={styles.gameMeta}>
            {gameSession.dateTime} · {gameSession.venueConfirmed ? gameSession.venueName : '待定店铺'}
          </Text>
        </View>
        <View className={styles.playerCount}>
          <Text className={styles.countNum}>{joinList.length + gameSession.currentPlayers}</Text>
          <Text className={styles.countSep}>/</Text>
          <Text className={styles.countTotal}>{gameSession.maxPlayers}</Text>
        </View>
      </View>

      {joinList.length > 0 && (
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <View className={classnames(styles.sectionDot, styles.dotJoin)} />
            <Text className={classnames(styles.sectionTitle, styles.titleJoin)}>
              直接上车 ({joinList.length})
            </Text>
          </View>
          <View className={styles.responseList}>
            {joinList.map((r) => (
              <View className={styles.responseItem} key={r.playerId}>
                <Image className={styles.responseAvatar} src={r.playerAvatar} mode="aspectFill" />
                <Text className={styles.responseName}>{r.playerName}</Text>
                <Text className={styles.responseTime}>{r.timestamp}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {rescheduleList.length > 0 && (
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <View className={classnames(styles.sectionDot, styles.dotReschedule)} />
            <Text className={classnames(styles.sectionTitle, styles.titleReschedule)}>
              想换时间 ({rescheduleList.length})
            </Text>
          </View>
          <View className={styles.responseList}>
            {rescheduleList.map((r) => (
              <View className={styles.responseItem} key={r.playerId}>
                <Image className={styles.responseAvatar} src={r.playerAvatar} mode="aspectFill" />
                <View className={styles.responseContent}>
                  <Text className={styles.responseName}>{r.playerName}</Text>
                  {r.message && <Text className={styles.responseMsg}>{r.message}</Text>}
                </View>
                <Text className={styles.responseTime}>{r.timestamp}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {backupList.length > 0 && (
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <View className={classnames(styles.sectionDot, styles.dotBackup)} />
            <Text className={classnames(styles.sectionTitle, styles.titleBackup)}>
              备选 ({backupList.length})
            </Text>
          </View>
          <View className={styles.responseList}>
            {backupList.map((r) => (
              <View className={styles.responseItem} key={r.playerId}>
                <Image className={styles.responseAvatar} src={r.playerAvatar} mode="aspectFill" />
                <Text className={styles.responseName}>{r.playerName}</Text>
                <Text className={styles.responseTime}>{r.timestamp}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {responses.length === 0 && (
        <View className={styles.empty}>
          <Text className={styles.emptyText}>暂无人响应，等一等～</Text>
        </View>
      )}
    </View>
  );
};

export default FeedbackCard;
