import React, { useState, useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import GameCard from '@/components/GameCard';
import { useAppStore } from '@/store/useAppStore';
import { genreOptions } from '@/data/availability';
import classnames from 'classnames';
import styles from './index.module.scss';

const GaragePage = () => {
  const { games, respondToGame } = useAppStore();
  const [activeFilter, setActiveFilter] = useState('全部');

  const filteredGames = useMemo(() => {
    if (activeFilter === '全部') return games;
    if (activeFilter === '待响应') return games.filter((g) => !g.myResponse);
    if (activeFilter === '已上车') return games.filter((g) => g.myResponse === 'join');
    return games.filter((g) => g.genre === activeFilter);
  }, [games, activeFilter]);

  const filterTags = ['全部', '待响应', '已上车', ...genreOptions];

  return (
    <View className={styles.page}>
      <Text className={styles.pageTitle}>熟人车库</Text>
      <Text className={styles.pageDesc}>好友发起的私密车局，安静表达你的意愿</Text>

      <View className={styles.filterBar}>
        {filterTags.map((tag) => (
          <View
            key={tag}
            className={classnames(styles.filterTag, activeFilter === tag && styles.filterTagActive)}
            onClick={() => setActiveFilter(tag)}
          >
            <Text>{tag}</Text>
          </View>
        ))}
      </View>

      <View className={styles.gameList}>
        {filteredGames.length > 0 ? (
          filteredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onResponse={(gameId, response) => {
                console.info('[Garage] 响应车局:', gameId, response);
                respondToGame(gameId, response);
              }}
            />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>🎮</Text>
            <Text className={styles.emptyText}>暂无车局</Text>
            <Text className={styles.emptyHint}>等朋友发起吧～</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default GaragePage;
