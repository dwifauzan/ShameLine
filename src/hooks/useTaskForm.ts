import { useCallback, useRef, useState } from 'react';
import { Alert, TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import { t } from '../i18n';
import { useTaskStore } from '../stores/taskStore';
import { usePunishmentStore } from '../stores/punishmentStore';
import { useStatsStore } from '../stores/statsStore';

export function useTaskForm() {
  const addTask = useTaskStore((s) => s.addTask);
  const incrementUseCount = usePunishmentStore((s) => s.incrementUseCount);
  const computeStats = useStatsStore((s) => s.computeStats);

  const [taskName, setTaskName] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [difficulty, setDifficulty] = useState(50);
  const [selectedPunishmentId, setSelectedPunishmentId] = useState<string | null>(null);

  const nameRef = useRef<TextInput>(null);
  const dayRef = useRef<TextInput>(null);
  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);
  const hourRef = useRef<TextInput>(null);
  const minuteRef = useRef<TextInput>(null);

  const resetForm = useCallback(() => {
    setTaskName('');
    setDay('');
    setMonth('');
    setYear(new Date().getFullYear().toString());
    setHour('');
    setMinute('');
    setDifficulty(50);
    setSelectedPunishmentId(null);
  }, []);

  const parseDeadline = useCallback((): number | null => {
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    const h = parseInt(hour, 10);
    const min = parseInt(minute, 10);

    if (isNaN(d) || isNaN(m) || isNaN(y) || isNaN(h) || isNaN(min)) return null;
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    if (y < 2024 || y > 2100) return null;
    if (h < 0 || h > 23 || min < 0 || min > 59) return null;

    const date = new Date(y, m - 1, d, h, min);
    if (isNaN(date.getTime())) return null;
    return date.getTime();
  }, [day, month, year, hour, minute]);

  const validateAndSave = useCallback((): boolean => {
    const name = taskName.trim();
    if (!name) {
      Alert.alert(t('tasks.validateName'));
      return false;
    }

    const deadline = parseDeadline();
    if (!deadline) {
      Alert.alert(t('tasks.validateDate'));
      return false;
    }

    if (deadline <= Date.now()) {
      Alert.alert(t('tasks.validateFuture'));
      return false;
    }

    if (!selectedPunishmentId) {
      Alert.alert(t('tasks.validatePunishment'));
      return false;
    }

    addTask({
      name,
      deadline,
      difficulty,
      punishmentId: selectedPunishmentId,
    });
    incrementUseCount(selectedPunishmentId);
    computeStats();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return true;
  }, [taskName, parseDeadline, selectedPunishmentId, difficulty, addTask, incrementUseCount, computeStats]);

  return {
    formState: {
      taskName,
      day,
      month,
      year,
      hour,
      minute,
      difficulty,
      selectedPunishmentId,
    },
    setters: {
      setTaskName,
      setDay,
      setMonth,
      setYear,
      setHour,
      setMinute,
      setDifficulty,
      setSelectedPunishmentId,
    },
    refs: {
      nameRef,
      dayRef,
      monthRef,
      yearRef,
      hourRef,
      minuteRef,
    },
    resetForm,
    validateAndSave,
  };
}
