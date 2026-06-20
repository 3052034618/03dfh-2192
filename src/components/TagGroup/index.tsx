import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface TagGroupProps {
  tags: string[];
  selectedTags: string[];
  onToggle: (tag: string) => void;
}

const TagGroup: React.FC<TagGroupProps> = ({ tags, selectedTags, onToggle }) => {
  return (
    <View className={styles.tagGroup}>
      {tags.map((tag) => {
        const isActive = selectedTags.includes(tag);
        return (
          <View
            key={tag}
            className={classnames(styles.tag, isActive && styles.tagActive)}
            onClick={() => onToggle(tag)}
          >
            <Text className={classnames(styles.tagText, isActive && styles.tagTextActive)}>
              {tag}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

export default TagGroup;
