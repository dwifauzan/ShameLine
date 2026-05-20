import { useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { t } from '../i18n';
import { useTaskStore } from '../stores/taskStore';
import { usePunishmentStore } from '../stores/punishmentStore';
import { useStatsStore } from '../stores/statsStore';
import { Punishment, Task } from '../types';

export function useTasks() {
  const tasks = useTaskStore((s) => s.tasks);
  const markCompleted = useTaskStore((s) => s.markCompleted);
  const giveUp = useTaskStore((s) => s.giveUp);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const punishments = usePunishmentStore((s) => s.punishments);
  const computeStats = useStatsStore((s) => s.computeStats);

  const afterAction = useCallback(() => {
    computeStats();
  }, [computeStats]);

  const punishmentMap = useMemo(() => {
    const map = new Map<string, Punishment>();
    for (const p of punishments) map.set(p.id, p);
    return map;
  }, [punishments]);

  const activeTasks = useMemo(() => tasks.filter((t) => t.status === 'active'), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.status === 'completed'), [tasks]);
  const shames = useMemo(
    () => tasks.filter((t) => t.givenUp).sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)),
    [tasks]
  );

  const handleComplete = useCallback(
    (task: Task) => {
      Alert.alert(t('tasks.markCompleteConfirm'), '', [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: () => {
            markCompleted(task.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            afterAction();
          },
        },
      ]);
    },
    [markCompleted, afterAction]
  );

  const handleGiveUp = useCallback(
    (task: Task) => {
      Alert.alert(t('tasks.giveUpConfirm'), '', [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: () => {
            giveUp(task.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            afterAction();
          },
        },
      ]);
    },
    [giveUp, afterAction]
  );

  const handleDelete = useCallback(
    (task: Task) => {
      Alert.alert(t('tasks.deleteConfirm'), t('common.areYouSure'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            deleteTask(task.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            afterAction();
          },
        },
      ]);
    },
    [deleteTask, afterAction]
  );

  const handleShameDelete = useCallback(
    (task: Task) => {
      Alert.alert(t('hallOfShame.deleteConfirm'), t('common.areYouSure'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            deleteTask(task.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            afterAction();
          },
        },
      ]);
    },
    [deleteTask, afterAction]
  );

  return {
    tasks,
    activeTasks,
    completedTasks,
    shames,
    punishmentMap,
    handleComplete,
    handleGiveUp,
    handleDelete,
    handleShameDelete,
  };
}
