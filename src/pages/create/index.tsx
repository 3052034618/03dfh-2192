import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

const CreatePage = () => {
  return (
    <View className={styles.page}>
      <Text className={styles.title}>发起组局</Text>
      <Text className={styles.hint}>功能正在开发中...</Text>
    </View>
  );
};

export default CreatePage;
