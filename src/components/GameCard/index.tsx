import React, { useState } from 'react';
import { View, Text, Image, Textarea } from '@tarojs/components';
import type { GameSession, ResponseType } from '@/types';
import classnames from 'classnames';
import styles from './index.module.scss';

interface GameCardProps {
  game: GameSession;
  onResponse?: (gameId: string, response: ResponseType, message?: string) => void;
  showResponse?: boolean;
}

const nameVisibilityMap: Record<string, string> = {
  all: '所有人可见',
  friends: '仅好友可见',
  'host-only': '仅车头可见',
};

const scoreTier = (score: number): { label: string; stars: number; tier: 'high' | 'mid' | 'low' } => {
  if (score >= 4) return { label: '超适配', stars: 3, tier: 'high' };
  if (score >= 1) return { label: '还不错', stars: 2, tier: 'mid' };
  if (score >= -1) return { label: '一般般', stars: 1, tier: 'mid' };
  return { label: '不太合适', stars: 0, tier: 'low' };
};

const GameCard: React.FC<GameCardProps> = ({ game, onResponse, showResponse = true }) => {
  const needPlayers = game.maxPlayers - game.currentPlayers;
  const [isEditing, setIsEditing] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleMsg, setRescheduleMsg] = useState(game.myResponseMessage || '');
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleResponse = (response: ResponseType, message = '') => {
    setIsEditing(false);
    setShowRescheduleModal(false);
    onResponse?.(game.id, response, message);
  };

  const handleRescheduleClick = () => {
    setRescheduleMsg(game.myResponseMessage || '');
    setShowRescheduleModal(true);
  };

  const handleConfirmReschedule = () => {
    handleResponse('reschedule', rescheduleMsg.trim());
  };

  const timeMatchLabel = {
    match: '✓ 时间合适',
    mismatch: '✗ 时间冲突',
    unknown: '',
  }[game.timeMatch || 'unknown'];

  const tier = scoreTier(game.matchScore);

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

      <View className={styles.matchHeader}>
        <View className={classnames(styles.scoreBadge, styles[`score${tier.tier}`])}>
          <Text className={styles.scoreText}>
            {'★'.repeat(tier.stars)}
            {'☆'.repeat(3 - tier.stars)}{' '}
            {tier.label}
          </Text>
        </View>
        {timeMatchLabel && (
          <View
            className={classnames(
              styles.timeMatch,
              game.timeMatch === 'match' && styles.timeMatchOk,
              game.timeMatch === 'mismatch' && styles.timeMatchBad
            )}
          >
            <Text className={styles.timeMatchText}>{timeMatchLabel}</Text>
          </View>
        )}
        <View className={styles.analysisToggle} onClick={() => setShowAnalysis(!showAnalysis)}>
          <Text className={styles.analysisToggleText}>{showAnalysis ? '收起详情' : '看匹配详情'}</Text>
          <Text className={classnames(styles.chevron, showAnalysis && styles.chevronUp)}>›</Text>
        </View>
      </View>

      {showAnalysis && (
        <View className={styles.analysisPanel}>
          {game.matchReasons.map((r, i) => (
            <View key={i} className={classnames(styles.reason, styles[`reason${r.type}`])}>
              <Text className={styles.reasonIcon}>{r.icon}</Text>
              <Text className={styles.reasonText}>{r.text}</Text>
            </View>
          ))}
        </View>
      )}

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
              {game.myResponse === 'reschedule' && game.myResponseMessage && (
                <Text className={styles.respondedMsg}>"{game.myResponseMessage}"</Text>
              )}
              <Text className={styles.changeBtn} onClick={() => setIsEditing(true)}>
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
                onClick={handleRescheduleClick}
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

      {showRescheduleModal && (
        <View className={styles.modalMask} onClick={() => setShowRescheduleModal(false)}>
          <View className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>想换个什么时间？</Text>
            <Text className={styles.modalHint}>可留空，举个例子：周六下午有事，周日全天可以</Text>
            <Textarea
              className={styles.modalInput}
              placeholder="简单说说你合适的时间，车头会看到～"
              value={rescheduleMsg}
              onInput={(e) => setRescheduleMsg(e.detail.value)}
              maxlength={60}
              autoHeight
            />
            <Text className={styles.modalCounter}>{rescheduleMsg.length}/60</Text>
            <View className={styles.modalActions}>
              <View
                className={classnames(styles.modalBtn, styles.modalBtnCancel)}
                onClick={() => setShowRescheduleModal(false)}
              >
                <Text className={styles.modalBtnCancelText}>取消</Text>
              </View>
              <View
                className={classnames(styles.modalBtn, styles.modalBtnConfirm)}
                onClick={handleConfirmReschedule}
              >
                <Text className={styles.modalBtnConfirmText}>确定提交</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default GameCard;
