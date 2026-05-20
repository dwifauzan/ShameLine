import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '../i18n';
import { Punishment, Task } from '../types';
import { PUNISHMENT_EMOJIS } from '../utils/constants';
import { formatDateTime, formatTimeRemaining, getUrgencyColor } from '../utils/helpers';
import DifficultyBar from './DifficultyBar';

interface TaskCardProps {
  task: Task;
  punishment: Punishment | undefined;
  onComplete: () => void;
  onGiveUp: () => void;
  onDelete: () => void;
}

export default function TaskCard({
  task,
  punishment,
  onComplete,
  onGiveUp,
  onDelete,
}: TaskCardProps) {
  const isCompleted = task.status === 'completed';
  const isLate = isCompleted && task.completedAt != null && task.completedAt > task.deadline;
  const urgencyColor = isCompleted ? '#95a5a6' : getUrgencyColor(task.deadline);
  const isOverdue = !isCompleted && Date.now() > task.deadline;

  return (
    <View style={[styles.taskCard, isCompleted && styles.taskCardCompleted]}>
      <View style={[styles.accentBar, { backgroundColor: urgencyColor }]} />
      <View style={styles.taskCardContent}>
        <View style={styles.taskCardHeader}>
          <Text style={[styles.taskName, isCompleted && styles.taskNameCompleted]} numberOfLines={1}>
            {task.name}
          </Text>
          {isOverdue && (
            <View style={styles.lateBadge}>
              <Text style={styles.lateBadgeText}>{t('tasks.lateBadge')}</Text>
            </View>
          )}
          {isCompleted && (
            <View style={[styles.statusBadge, isLate ? styles.statusBadgeLate : styles.statusBadgeOnTime]}>
              <Text style={styles.statusBadgeText}>
                {isLate ? t('tasks.late') : t('tasks.onTime')}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.taskDeadline}>{formatDateTime(task.deadline)}</Text>
        {!isCompleted && (
          <Text style={[styles.taskRemaining, { color: urgencyColor }]}>
            {formatTimeRemaining(task.deadline)}
          </Text>
        )}
        <DifficultyBar difficulty={task.difficulty} />
        {punishment && (
          <Text style={styles.taskPunishment} numberOfLines={1}>
            {PUNISHMENT_EMOJIS[punishment.type]} {punishment.title}
          </Text>
        )}
        <View style={styles.taskActions}>
          {!isCompleted && (
            <Pressable
              onPress={onComplete}
              style={({ pressed }) => [styles.actionBtn, styles.completeBtn, pressed && styles.actionBtnPressed]}
              hitSlop={8}
            >
              <Text style={styles.actionBtnText}>✅</Text>
            </Pressable>
          )}
          {!isCompleted && (
            <Pressable
              onPress={onGiveUp}
              style={({ pressed }) => [styles.actionBtn, styles.giveUpBtn, pressed && styles.actionBtnPressed]}
              hitSlop={8}
            >
              <Text style={styles.actionBtnText}>🏳️</Text>
            </Pressable>
          )}
          <Pressable
            onPress={onDelete}
            style={({ pressed }) => [styles.actionBtn, styles.deleteBtn, pressed && styles.actionBtnPressed]}
            hitSlop={8}
          >
            <Text style={styles.actionBtnText}>🗑️</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  taskCardCompleted: {
    opacity: 0.6,
    backgroundColor: '#fff',
    borderColor: '#f0f0f0',
  },
  accentBar: {
    width: 6,
  },
  taskCardContent: {
    flex: 1,
    padding: 16,
  },
  taskCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  taskName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a2e',
    flex: 1,
    marginRight: 8,
  },
  taskNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  lateBadge: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lateBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeLate: {
    backgroundColor: '#ffeef0',
  },
  statusBadgeOnTime: {
    backgroundColor: '#e7f9ee',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  taskDeadline: {
    fontSize: 13,
    color: '#777',
    marginBottom: 2,
  },
  taskRemaining: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
  },
  taskPunishment: {
    fontSize: 13,
    color: '#555',
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 4,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
  },
  actionBtnPressed: {
    backgroundColor: '#f0f0f0',
  },
  completeBtn: {
    borderColor: '#2ed573',
  },
  giveUpBtn: {
    borderColor: '#ffa502',
  },
  deleteBtn: {
    borderColor: '#ff4757',
  },
  actionBtnText: {
    fontSize: 16,
  },
});
