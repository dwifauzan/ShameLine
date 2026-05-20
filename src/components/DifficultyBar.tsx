import React from 'react';
import { StyleSheet, View } from 'react-native';

interface DifficultyBarProps {
  difficulty: number;
}

export default function DifficultyBar({ difficulty }: DifficultyBarProps) {
  return (
    <View style={styles.difficultyRow}>
      {Array.from({ length: 11 }, (_, i) => {
        const level = i * 10;
        const filled = level <= difficulty;
        let color = '#27ae60';
        if (level > 60) color = '#e74c3c';
        else if (level > 30) color = '#f39c12';
        return (
          <View
            key={level}
            style={[
              styles.difficultyDot,
              { backgroundColor: filled ? color : '#e0e0e0' },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  difficultyRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  difficultyDot: {
    width: 10,
    height: 6,
    borderRadius: 3,
  },
});
