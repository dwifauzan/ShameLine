import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { t } from '../i18n';
import { useTasks } from '../hooks/useTasks';
import { useStatsStore } from '../stores/statsStore';
import { PUNISHMENT_EMOJIS } from '../utils/constants';
import { formatLongestRecord } from '../utils/helpers';
import ShameCard from '../components/ShameCard';

export default function HallOfShameScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const { shames, punishmentMap, handleShameDelete } = useTasks();
  const stats = useStatsStore((s) => s.stats);
  const computeStats = useStatsStore((s) => s.computeStats);

  useEffect(() => {
    computeStats();
  }, [computeStats]);

  const mostUsedPunishment = stats.mostUsedPunishmentId
    ? punishmentMap.get(stats.mostUsedPunishmentId)
    : undefined;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('hallOfShame.title')}</Text>

        {/* Stats Summary Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <Text style={styles.statsEmoji}>💀</Text>
            <View style={styles.statsInfo}>
              <Text style={styles.statsLabel}>{t('hallOfShame.shameCount')}</Text>
              <Text style={styles.statsValue}>{shames.length}</Text>
            </View>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsRow}>
            <Text style={styles.statsEmoji}>⏱️</Text>
            <View style={styles.statsInfo}>
              <Text style={styles.statsLabel}>{t('hallOfShame.longestRecord')}</Text>
              <Text style={styles.statsValue}>{formatLongestRecord(stats.longestLateHours)}</Text>
            </View>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsRow}>
            <Text style={styles.statsEmoji}>🏆</Text>
            <View style={styles.statsInfo}>
              <Text style={styles.statsLabel}>{t('hallOfShame.mostUsedPunishment')}</Text>
              <Text style={styles.statsValue}>
                {mostUsedPunishment
                  ? `${PUNISHMENT_EMOJIS[mostUsedPunishment.type]} ${mostUsedPunishment.title}`
                  : '-'}
              </Text>
            </View>
          </View>
        </View>

        {/* Shame list */}
        {shames.length > 0 ? (
          <>
            <Text style={styles.sectionHeader}>
              {t('hallOfShame.recentShames')} ({shames.length})
            </Text>
            {shames.map((task) => (
              <ShameCard
                key={task.id}
                task={task}
                punishment={punishmentMap.get(task.punishmentId)}
                onDelete={() => handleShameDelete(task)}
              />
            ))}
          </>
        ) : (
          <Text style={styles.emptyText}>{t('hallOfShame.empty')}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 100,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statsEmoji: {
    fontSize: 22,
    marginRight: 12,
  },
  statsInfo: {
    flex: 1,
  },
  statsLabel: {
    fontSize: 13,
    color: '#777',
  },
  statsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginTop: 2,
  },
  statsDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginTop: 20,
    marginBottom: 10,
  },
});
