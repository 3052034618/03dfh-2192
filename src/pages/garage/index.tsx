import React, { useState, useMemo, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import GameCard from '@/components/GameCard';
import { useAppStore } from '@/store/useAppStore';
import { genreOptions } from '@/data/availability';
import classnames from 'classnames';
import styles from './index.module.scss';

const GaragePage = () => {
  const { games, respondToGame } = useAppStore();
  const [activeFilter, setActiveFilter] = useState('适合我优先');
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const scrollToGame = (gameId: string) => {
    setHighlightId(gameId);
    setTimeout(() => {
      try {
        const query = Taro.createSelectorQuery();
        query.select(`#game-${gameId}`).boundingClientRect();
        query.selectViewport().scrollOffset();
        query.exec((res) => {
          if (res && res[0] && res[1]) {
            Taro.pageScrollTo({
              scrollTop: (res[0].top ?? 0) + (res[1].scrollTop ?? 0) - 100,
              duration: 300,
            });
          }
        });
      } catch (e) {
        console.warn('[Garage] scrollToGame failed:', e);
      }
    }, 400);
  };

  useEffect(() => {
    Taro.eventCenter.on('scrollToGame', scrollToGame);
    return () => {
      Taro.eventCenter.off('scrollToGame', scrollToGame);
    };
  }, []);

  useDidShow(() => {
    if (highlightId) {
      const timer = setTimeout(() => {
        setHighlightId(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  });

  const filteredGames = useMemo(() => {
    let list = [...games];
    if (activeFilter === '适合我优先') {
      list.sort((a, b) => b.matchScore - a.matchScore);
    } else if (activeFilter === '全部') {
    } else if (activeFilter === '待响应') {
      list = list.filter((g) => !g.myResponse);
    } else if (activeFilter === '已上车') {
      list = list.filter((g) => g.myResponse === 'join');
    } else if (activeFilter === '快缺人') {
      list = list.filter((g) => g.maxPlayers - g.currentPlayers <= 2);
      list.sort((a, b) => a.maxPlayers - a.currentPlayers - (b.maxPlayers - b.currentPlayers));
    } else {
      list = list.filter((g) => g.genre === activeFilter);
    }
    return list;
  }, [games, activeFilter]);

  const filterTags = ['适合我优先', '全部', '待响应', '已上车', '快缺人', ...genreOptions];

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
          filteredGames.map((game, idx) => (
            <View
              key={game.id}
              id={`game-${game.id}`}
              className={classnames(highlightId === game.id && styles.highlightCard)}
            >
              {activeFilter === '适合我优先' && idx === 0 && (
                <View className={styles.bestMatchTip}>
                  <Text className={styles.bestMatchText}>⭐ 最推荐的车局</Text>
                </View>
              )}
              <GameCard
                game={game}
                onResponse={(gameId, response, message) => {
                  console.info('[Garage] respond:', gameId, response, message);
                  respondToGame(gameId, response, message);
                }}
              />
            </View>
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
