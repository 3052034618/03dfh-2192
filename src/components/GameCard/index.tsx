import React, { useState } from 'react';
import { View, Text, Image } from '@tarojs/components';
import type { GameSession, ResponseType } from '@/types';
import classnames from 'classnames';
import styles from './index.module.scss';

interface GameCardProps {
  game: GameSession;
  onResponse?: (gameId: string, response: ResponseType) => void;
  showResponse?: boolean;
}

const nameVisibilityMap: Record<string, string> = {
  all: '所有人可见',
  friends: '仅好友可见',
  'host-only': '仅车头可见',
};

const GameCard: React.FC<GameCardProps> = ({ game, onResponse, showResponse = true }) => {
  const needPlayers = game.maxPlayers - game.currentPlayers;
  const [isEditing, setIsEditing] = useState(false);

  const handleResponse = (response: ResponseType) => {
    setIsEditing(false);
    onResponse?.(game.id, response);
  };

  return (
    <View className={styles.card}>
      <View className={styles.cardHeader}>
        <Image className={styles.avatar} src={game.hostAvatar} mode="aspectFill" />
        <View className={styles.hostInfo}>
          <Text className={styles.hostName}>{game.hostName} 发起</Text>
          <Text className={styles.visibility}>{nameVisibilityMap[game.nameVisibility]}</Text>
        </View>
        <View className={classnames(styles.genreTag, styles[`genre${game.genre}`])}>
          <Text className={styles.genreText}>{game.genre}</Text>
        </View>
      </View>

      <View className={styles.cardBody}>
        <Text className={styles.gameName}>{game.gameName}</Text>
        <Text className={styles.description}>{game.description}</Text>
      </View>

      <View className={styles.cardMeta}>
        <View className={styles.metaItem}>
          <Text className={styles.metaIcon}>🕐</Text>
          <Text className={styles.metaText}>{game.dateTime}</Text>
        </View>
        <View className={styles.metaItem}>
          <Text className={styles.metaIcon}>🏁</Text>
          <Text className={styles.metaText}>{game.endTime}</Text>
        </View>
        <View className={styles.metaItem}>
          <Text className={styles.metaIcon}>👥</Text>
          <Text className={classnames(styles.metaText, needPlayers <= 2 && styles.urgent)}>
            还差{needPlayers}人
          </Text>
        </View>
        <View className={styles.metaItem}>
          <Text className={styles.metaIcon}>{game.venueConfirmed ? '📍' : '📌'}</Text>
          <Text className={classnames(styles.metaText, !game.venueConfirmed && styles.unconfirmed)}>
            {game.venueConfirmed ? game.venueName : '待定店铺'}
          </Text>
        </View>
      </View>

      {showResponse && (
        <View className={styles.responseBar}>
          {game.myResponse && !isEditing ? (
            <View className={styles.responded}>
              <Text className={styles.respondedText}>
                {game.myResponse === 'join' && '已上车 ✓'}
                {game.myResponse === 'reschedule' && '想换时间 ⏰'}
                {game.myResponse === 'backup' && '已当备选 📋'}
              </Text>
              <Text
                className={styles.changeBtn}
                onClick={() => setIsEditing(true)}
              >
                修改
              </Text>
            </View>
          ) : (
            <View className={styles.responseButtons}>
              <View
                className={classnames(styles.responseBtn, styles.joinBtn)}
                onClick={() => handleResponse('join')}
              >
                <Text className={styles.joinBtnText}>直接上车</Text>
              </View>
              <View
                className={classnames(styles.responseBtn, styles.rescheduleBtn)}
                onClick={() => handleResponse('reschedule')}
              >
                <Text className={styles.rescheduleBtnText}>想玩但换时间</Text>
              </View>
              <View
                className={classnames(styles.responseBtn, styles.backupBtn)}
                onClick={() => handleResponse('backup')}
              >
                <Text className={styles.backupBtnText}>只当备选</Text>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default GameCard;
