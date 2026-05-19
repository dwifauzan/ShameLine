import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { t } from '../i18n';
import { useTaskStore } from '../stores/taskStore';
import { usePunishmentStore } from '../stores/punishmentStore';
import { useStatsStore } from '../stores/statsStore';
import { Punishment, PunishmentType, Task } from '../types';

// --- Urgency helpers ---

function getUrgencyColor(deadline: number): string {
  const now = Date.now();
  const diff = deadline - now;
  const hours = diff / (1000 * 60 * 60);

  if (diff <= 0 || hours < 1) return '#e74c3c';
  if (hours < 6) return '#f39c12';
  if (hours < 24) return '#f1c40f';
  if (hours < 72) return '#27ae60';
  return '#95a5a6';
}

function formatTimeRemaining(deadline: number): string {
  const now = Date.now();
  const diff = deadline - now;
  if (diff <= 0) return t('tasks.lateBadge');

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return remainingHours > 0
      ? `${days}d ${remainingHours}h ${t('tasks.timeRemaining')}`
      : `${days}d ${t('tasks.timeRemaining')}`;
  }
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m ${t('tasks.timeRemaining')}`
      : `${hours}h ${t('tasks.timeRemaining')}`;
  }
  return `${minutes}m ${t('tasks.timeRemaining')}`;
}

function formatDeadline(deadline: number): string {
  const d = new Date(deadline);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const PUNISHMENT_EMOJIS: Record<PunishmentType, string> = {
  whatsapp: '\uD83D\uDCAC',
  wallpaper: '\uD83D\uDDBC\uFE0F',
  youtube: '\uD83C\uDFA5',
  alarm: '\u23F0',
};

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

function TaskCard({
  task,
  punishment,
  onComplete,
  onGiveUp,
  onDelete,
}: {
  task: Task;
  punishment: Punishment | undefined;
  onComplete: () => void;
  onGiveUp: () => void;
  onDelete: () => void;
}) {
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
        <Text style={styles.taskDeadline}>{formatDeadline(task.deadline)}</Text>
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
              <Text style={styles.actionBtnText}>{'\u2705'}</Text>
            </Pressable>
          )}
          {!isCompleted && (
            <Pressable
              onPress={onGiveUp}
              style={({ pressed }) => [styles.actionBtn, styles.giveUpBtn, pressed && styles.actionBtnPressed]}
              hitSlop={8}
            >
              <Text style={styles.actionBtnText}>{'\uD83C\uDFF3\uFE0F'}</Text>
            </Pressable>
          )}
          <Pressable
            onPress={onDelete}
            style={({ pressed }) => [styles.actionBtn, styles.deleteBtn, pressed && styles.actionBtnPressed]}
            hitSlop={8}
          >
            <Text style={styles.actionBtnText}>{'\uD83D\uDDD1\uFE0F'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// --- Main Screen ---

export default function TasksScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const tasks = useTaskStore((s) => s.tasks);
  const addTask = useTaskStore((s) => s.addTask);
  const markCompleted = useTaskStore((s) => s.markCompleted);
  const giveUp = useTaskStore((s) => s.giveUp);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const punishments = usePunishmentStore((s) => s.punishments);
  const incrementUseCount = usePunishmentStore((s) => s.incrementUseCount);
  const computeStats = useStatsStore((s) => s.computeStats);

  const [modalVisible, setModalVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [completedExpanded, setCompletedExpanded] = useState(false);

  // Form state
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

  const afterAction = useCallback(() => {
    computeStats();
  }, [computeStats]);

  // --- Derived data ---
  const punishmentMap = useMemo(() => {
    const map = new Map<string, Punishment>();
    for (const p of punishments) map.set(p.id, p);
    return map;
  }, [punishments]);

  const activeTasks = useMemo(() => tasks.filter((t) => t.status === 'active'), [tasks]);
  const completedTasks = useMemo(
    () => tasks.filter((t) => t.status === 'completed'),
    [tasks],
  );

  const selectedPunishment = selectedPunishmentId ? punishmentMap.get(selectedPunishmentId) : undefined;

  // --- Actions ---
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
    [markCompleted, afterAction],
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
    [giveUp, afterAction],
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
    [deleteTask, afterAction],
  );

  // --- Modal helpers ---
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

  const openModal = useCallback(() => {
    resetForm();
    setModalVisible(true);
    setTimeout(() => nameRef.current?.focus(), 300);
  }, [resetForm]);

  const closeModal = useCallback(() => {
    setModalVisible(false);
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

  const handleSave = useCallback(() => {
    const name = taskName.trim();
    if (!name) {
      Alert.alert(t('tasks.validateName'));
      return;
    }

    const deadline = parseDeadline();
    if (!deadline) {
      Alert.alert(t('tasks.validateDate'));
      return;
    }

    if (deadline <= Date.now()) {
      Alert.alert(t('tasks.validateFuture'));
      return;
    }

    if (!selectedPunishmentId) {
      Alert.alert(t('tasks.validatePunishment'));
      return;
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
    closeModal();
  }, [taskName, parseDeadline, selectedPunishmentId, difficulty, addTask, incrementUseCount, computeStats, closeModal]);

  const noTasks = activeTasks.length === 0 && completedTasks.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('tasks.title')}</Text>

        {noTasks && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>\uD83D\uDCCB</Text>
            <Text style={styles.emptyText}>{t('tasks.empty')}</Text>
          </View>
        )}

        {activeTasks.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>{t('tasks.activeTasks')}</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{activeTasks.length}</Text>
              </View>
            </View>
            {activeTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                punishment={punishmentMap.get(task.punishmentId)}
                onComplete={() => handleComplete(task)}
                onGiveUp={() => handleGiveUp(task)}
                onDelete={() => handleDelete(task)}
              />
            ))}
          </>
        )}

        {completedTasks.length > 0 && (
          <>
            <Pressable
              style={[styles.sectionHeaderRow, { marginTop: 24 }]}
              onPress={() => setCompletedExpanded((e) => !e)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.sectionHeader}>{t('tasks.completedTasks')}</Text>
                <View style={[styles.countBadge, { backgroundColor: '#e0e0e0' }]}>
                  <Text style={[styles.countBadgeText, { color: '#777' }]}>{completedTasks.length}</Text>
                </View>
              </View>
              <Text style={styles.chevron}>{completedExpanded ? '\u25B2' : '\u25BC'}</Text>
            </Pressable>
            {completedExpanded &&
              completedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  punishment={punishmentMap.get(task.punishmentId)}
                  onComplete={() => {}}
                  onGiveUp={() => {}}
                  onDelete={() => handleDelete(task)}
                />
              ))}
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { bottom: tabBarHeight + 20 },
          pressed && { transform: [{ scale: 0.95 }], opacity: 0.9 }
        ]}
        onPress={openModal}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      {/* Add Task Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>{t('tasks.addTask')}</Text>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.modalScroll}
              >
                {/* Task Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('tasks.taskName')}</Text>
                  <TextInput
                    ref={nameRef}
                    style={styles.textInput}
                    placeholder={t('tasks.taskNamePlaceholder')}
                    value={taskName}
                    onChangeText={setTaskName}
                    placeholderTextColor="#bbb"
                  />
                </View>

                {/* Deadline */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('tasks.deadline')}</Text>
                  <View style={styles.dateTimeContainer}>
                    <View style={styles.dateInputs}>
                      <TextInput
                        ref={dayRef}
                        style={styles.dateInput}
                        placeholder="DD"
                        value={day}
                        onChangeText={(val) => {
                          setDay(val);
                          if (val.length === 2) monthRef.current?.focus();
                        }}
                        keyboardType="number-pad"
                        maxLength={2}
                      />
                      <Text style={styles.dateSeparator}>/</Text>
                      <TextInput
                        ref={monthRef}
                        style={styles.dateInput}
                        placeholder="MM"
                        value={month}
                        onChangeText={(val) => {
                          setMonth(val);
                          if (val.length === 2) yearRef.current?.focus();
                        }}
                        keyboardType="number-pad"
                        maxLength={2}
                      />
                      <Text style={styles.dateSeparator}>/</Text>
                      <TextInput
                        ref={yearRef}
                        style={[styles.dateInput, { width: 60 }]}
                        placeholder="YYYY"
                        value={year}
                        onChangeText={(val) => {
                          setYear(val);
                          if (val.length === 4) hourRef.current?.focus();
                        }}
                        keyboardType="number-pad"
                        maxLength={4}
                      />
                    </View>
                    <View style={styles.timeInputs}>
                      <TextInput
                        ref={hourRef}
                        style={styles.dateInput}
                        placeholder="HH"
                        value={hour}
                        onChangeText={(val) => {
                          setHour(val);
                          if (val.length === 2) minuteRef.current?.focus();
                        }}
                        keyboardType="number-pad"
                        maxLength={2}
                      />
                      <Text style={styles.dateSeparator}>:</Text>
                      <TextInput
                        ref={minuteRef}
                        style={styles.dateInput}
                        placeholder="MM"
                        value={minute}
                        onChangeText={setMinute}
                        keyboardType="number-pad"
                        maxLength={2}
                      />
                    </View>
                  </View>
                </View>

                {/* Difficulty */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>{t('tasks.difficulty')}</Text>
                    <Text style={[styles.difficultyValue, { color: difficulty > 60 ? '#e74c3c' : difficulty > 30 ? '#f39c12' : '#27ae60' }]}>
                      {difficulty}
                    </Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.difficultyContainer}
                  >
                    {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((level) => {
                      const selected = level === difficulty;
                      let color = '#27ae60';
                      if (level > 60) color = '#e74c3c';
                      else if (level > 30) color = '#f39c12';

                      return (
                        <Pressable
                          key={level}
                          onPress={() => {
                            setDifficulty(level);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }}
                          style={[
                            styles.difficultyOption,
                            selected && { backgroundColor: color, borderColor: color }
                          ]}
                        >
                          <Text style={[styles.difficultyText, selected && { color: '#fff' }]}>
                            {level}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Punishment */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('tasks.punishment')}</Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.punishmentSelector,
                      pressed && { opacity: 0.7, backgroundColor: '#f0f0f0' }
                    ]}
                    onPress={() => setPickerVisible(true)}
                  >
                    {selectedPunishment ? (
                      <View style={styles.selectedPunishmentContent}>
                        <Text style={styles.punishmentIcon}>
                          {PUNISHMENT_EMOJIS[selectedPunishment.type]}
                        </Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.punishmentTitle}>{selectedPunishment.title}</Text>
                          <Text style={styles.punishmentDesc} numberOfLines={1}>
                            {selectedPunishment.message}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.punishmentPlaceholder}>{t('tasks.selectPunishment')}</Text>
                    )}
                    <Text style={styles.selectorArrow}>\u203A</Text>
                  </Pressable>
                </View>

                <View style={styles.modalFooter}>
                  <Pressable style={styles.cancelButton} onPress={closeModal}>
                    <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                  </Pressable>
                  <Pressable style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Punishment Picker Modal */}
      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <Pressable style={styles.pickerOverlay} onPress={() => setPickerVisible(false)}>
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{t('tasks.selectPunishment')}</Text>
              <Pressable onPress={() => setPickerVisible(false)} hitSlop={10}>
                <Text style={styles.pickerClose}>\u2715</Text>
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {punishments.map((p) => {
                const isSelected = p.id === selectedPunishmentId;
                return (
                  <Pressable
                    key={p.id}
                    style={({ pressed }) => [
                      styles.pickerOption,
                      isSelected && styles.pickerOptionSelected,
                      pressed && { backgroundColor: '#f5f5f5' }
                    ]}
                    onPress={() => {
                      setSelectedPunishmentId(p.id);
                      setPickerVisible(false);
                      Haptics.selectionAsync();
                    }}
                  >
                    <View style={styles.pickerOptionIconContainer}>
                      <Text style={styles.pickerOptionEmoji}>{PUNISHMENT_EMOJIS[p.type]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pickerOptionTitle, isSelected && styles.pickerOptionTitleSelected]}>
                        {p.title}
                      </Text>
                      <Text style={styles.pickerOptionMessage} numberOfLines={2}>
                        {p.message}
                      </Text>
                    </View>
                    {isSelected && <Text style={styles.pickerOptionCheck}>\u2713</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a2e',
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 120,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.2,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  countBadge: {
    backgroundColor: '#6c5ce7',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  chevron: {
    fontSize: 14,
    color: '#bbb',
  },

  // TaskCard
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

  // FAB
  fab: {
    position: 'absolute',
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6c5ce7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
    marginTop: -2,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
  },
  modalHeader: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#e0e0e0',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  modalScroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 10,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#eee',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  dateInputs: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  timeInputs: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  dateInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1a1a2e',
    textAlign: 'center',
  },
  dateSeparator: {
    fontSize: 16,
    color: '#ccc',
  },
  difficultyValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  difficultyContainer: {
    paddingRight: 20,
  },
  difficultyOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  difficultyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#777',
  },
  punishmentSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedPunishmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  punishmentIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  punishmentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  punishmentDesc: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  punishmentPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#bbb',
  },
  selectorArrow: {
    fontSize: 24,
    color: '#ccc',
    marginLeft: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#777',
  },
  saveButton: {
    flex: 2,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6c5ce7',
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // Picker
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickerCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  pickerClose: {
    fontSize: 18,
    color: '#bbb',
    fontWeight: '600',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  pickerOptionSelected: {
    borderColor: '#6c5ce7',
    backgroundColor: '#f0edff',
  },
  pickerOptionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  pickerOptionEmoji: {
    fontSize: 22,
  },
  pickerOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  pickerOptionTitleSelected: {
    color: '#6c5ce7',
  },
  pickerOptionMessage: {
    fontSize: 13,
    color: '#777',
    lineHeight: 18,
  },
  pickerOptionCheck: {
    fontSize: 18,
    color: '#6c5ce7',
    fontWeight: '700',
    marginLeft: 8,
  },
});
