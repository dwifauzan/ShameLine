import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '../i18n';
import { Punishment, Task } from '../types';
import { PUNISHMENT_EMOJIS } from '../utils/constants';
import { formatDateTime, formatLateBy } from '../utils/helpers';
import DifficultyBar from './DifficultyBar';

interface ShameCardProps {
  task: Task;
  punishment: Punishment | undefined;
  onDelete: () => void;
}

export default function ShameCard({ task, punishment, onDelete }: ShameCardProps) {
  return (
    <View style={styles.shameCard}>
      <View style={[styles.accentBar, { backgroundColor: '#e74c3c' }]} />
      <View style={styles.shameCardContent}>
        <Text style={styles.shameTaskName} numberOfLines={1}>{task.name}</Text>

        <View style={styles.shameMetaRow}>
          <Text style={styles.shameMetaLabel}>{t('hallOfShame.deadline')}</Text>
          <Text style={styles.shameMetaValue}>{formatDateTime(task.deadline)}</Text>
        </View>

        <View style={styles.shameMetaRow}>
          <Text style={styles.shameMetaLabel}>{t('hallOfShame.executedAt')}</Text>
          <Text style={styles.shameMetaValue}>
            {task.completedAt ? formatDateTime(task.completedAt) : '-'}
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
            <Text style={styles.deleteBtnText}>🗑️</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
