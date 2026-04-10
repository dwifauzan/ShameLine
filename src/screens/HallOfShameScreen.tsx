import React, { useCallback, useEffect, useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { t } from '../i18n';
import { useTaskStore } from '../stores/taskStore';
import { usePunishmentStore } from '../stores/punishmentStore';
import { useStatsStore } from '../stores/statsStore';
import { Punishment, PunishmentType, Task } from '../types';

// --- Helpers ---

const PUNISHMENT_EMOJIS: Record<PunishmentType, string> = {
  whatsapp: '\uD83D\uDCAC',
  wallpaper: '\uD83D\uDDBC\uFE0F',
  youtube: '\uD83C\uDFA5',
  alarm: '\u23F0',
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatLateBy(deadline: number, completedAt: number | null): string {
  if (!completedAt) return '';
  const diff = completedAt - deadline;
  if (diff <= 0) return '';
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0 && hours > 0) return `${days}${t('hallOfShame.daysShort')} ${hours}${t('hallOfShame.hoursShort')}`;
  if (days > 0) return `${days}${t('hallOfShame.daysShort')}`;
  return `${hours}${t('hallOfShame.hoursShort')}`;
}

function formatLongestRecord(hours: number): string {
  if (hours <= 0) return '-';
  const days = Math.floor(hours / 24);
  const h = hours % 24;
  if (days > 0 && h > 0) return `${days}${t('hallOfShame.daysShort')} ${h}${t('hallOfShame.hoursShort')}`;
  if (days > 0) return `${days}${t('hallOfShame.daysShort')}`;
  return `${hours}${t('hallOfShame.hoursShort')}`;
}

// --- Components ---

function DifficultyBar({ difficulty }: { difficulty: number }) {
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
            style={[styles.difficultyDot, { backgroundColor: filled ? color : '#e0e0e0' }]}
          />
        );
      })}
    </View>
  );
}

function ShameCard({
  task,
  punishment,
  onDelete,
}: {
  task: Task;
  punishment: Punishment | undefined;
  onDelete: () => void;
}) {
  return (
    <View style={styles.shameCard}>
      <View style={[styles.accentBar, { backgroundColor: '#e74c3c' }]} />
      <View style={styles.shameCardContent}>
        <Text style={styles.shameTaskName} numberOfLines={1}>{task.name}</Text>

        <View style={styles.shameMetaRow}>
          <Text style={styles.shameMetaLabel}>{t('hallOfShame.deadline')}</Text>
          <Text style={styles.shameMetaValue}>{formatDate(task.deadline)}</Text>
        </View>

        <View style={styles.shameMetaRow}>
          <Text style={styles.shameMetaLabel}>{t('hallOfShame.executedAt')}</Text>
          <Text style={styles.shameMetaValue}>
            {task.completedAt ? formatDate(task.completedAt) : '-'}
          </Text>
        </View>

        {task.completedAt && task.completedAt > task.deadline && (
          <View style={styles.lateBadge}>
            <Text style={styles.lateBadgeText}>
              {t('hallOfShame.howLate')}: {formatLateBy(task.deadline, task.completedAt)}
            </Text>
          </View>
        )}

        <DifficultyBar difficulty={task.difficulty} />

        {punishment ? (
          <>
            <Text style={styles.shamePunishmentTitle} numberOfLines={1}>
              {PUNISHMENT_EMOJIS[punishment.type]} {punishment.title}
            </Text>
            <Text style={styles.shamePunishmentMsg} numberOfLines={2}>
              {punishment.message}
            </Text>
          </>
        ) : (
          <Text style={styles.shameNoPunishment}>{t('hallOfShame.noPunishment')}</Text>
        )}

        <View style={styles.shameActions}>
          <Pressable
            onPress={onDelete}
            style={({ pressed }) => [styles.deleteBtn, pressed && styles.deleteBtnPressed]}
            hitSlop={8}
          >
            <Text style={styles.deleteBtnText}>{'\uD83D\uDDD1\uFE0F'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// --- Main Screen ---

export default function HallOfShameScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const tasks = useTaskStore((s) => s.tasks);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const punishments = usePunishmentStore((s) => s.punishments);
  const stats = useStatsStore((s) => s.stats);
  const computeStats = useStatsStore((s) => s.computeStats);

  useEffect(() => {
    computeStats();
  }, [computeStats]);

  const punishmentMap = useMemo(() => {
    const map = new Map<string, Punishment>();
    for (const p of punishments) map.set(p.id, p);
    return map;
  }, [punishments]);

  const shames = useMemo(
    () =>
      tasks
        .filter((t) => t.givenUp)
        .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)),
    [tasks],
  );

  const mostUsedPunishment = stats.mostUsedPunishmentId
    ? punishmentMap.get(stats.mostUsedPunishmentId)
    : undefined;

  const handleDelete = useCallback(
    (task: Task) => {
      Alert.alert(t('hallOfShame.deleteConfirm'), t('common.areYouSure'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            deleteTask(task.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            computeStats();
          },
        },
      ]);
    },
    [deleteTask, computeStats],
  );

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
            <Text style={styles.statsEmoji}>{'\uD83D\uDC80'}</Text>
            <View style={styles.statsInfo}>
              <Text style={styles.statsLabel}>{t('hallOfShame.shameCount')}</Text>
              <Text style={styles.statsValue}>{shames.length}</Text>
            </View>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsRow}>
            <Text style={styles.statsEmoji}>{'\u23F1\uFE0F'}</Text>
            <View style={styles.statsInfo}>
              <Text style={styles.statsLabel}>{t('hallOfShame.longestRecord')}</Text>
              <Text style={styles.statsValue}>{formatLongestRecord(stats.longestLateHours)}</Text>
            </View>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsRow}>
            <Text style={styles.statsEmoji}>{'\uD83C\uDFC6'}</Text>
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
                onDelete={() => handleDelete(task)}
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

// --- Styles ---

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

  // Stats Card
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

  // Section
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginTop: 20,
    marginBottom: 10,
  },

  // Shame Card
  shameCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
  },
  shameCardContent: {
    flex: 1,
    padding: 14,
  },
  shameTaskName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    textDecorationLine: 'line-through',
  },
  shameMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  shameMetaLabel: {
    fontSize: 12,
    color: '#999',
  },
  shameMetaValue: {
    fontSize: 12,
    color: '#777',
  },
  lateBadge: {
    backgroundColor: '#fef9e7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  lateBadgeText: {
    color: '#f39c12',
    fontSize: 12,
    fontWeight: '600',
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 8,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  shamePunishmentTitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 6,
  },
  shamePunishmentMsg: {
    fontSize: 12,
    color: '#aaa',
    fontStyle: 'italic',
    marginTop: 2,
  },
  shameNoPunishment: {
    fontSize: 12,
    color: '#ccc',
    fontStyle: 'italic',
    marginTop: 6,
  },
  shameActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  deleteBtn: {
    padding: 6,
  },
  deleteBtnPressed: {
    opacity: 0.5,
  },
  deleteBtnText: {
    fontSize: 20,
  },
});
