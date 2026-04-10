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
  const [year, setYear] = useState('');
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
    setYear('');
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

  // --- Segmented input helper ---
  const segStyle = styles.segInput;
  const segOnFocus = (nextRef: React.RefObject<TextInput | null>) => ({
    onFocus: () => nextRef.current?.focus(),
  });

  const noTasks = activeTasks.length === 0 && completedTasks.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('tasks.title')}</Text>

        {noTasks && (
          <Text style={styles.emptyText}>{t('tasks.empty')}</Text>
        )}

        {activeTasks.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>
              {t('tasks.activeTasks')} ({activeTasks.length})
            </Text>
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
              style={styles.sectionHeaderRow}
              onPress={() => setCompletedExpanded((e) => !e)}
            >
              <Text style={styles.sectionHeader}>
                {t('tasks.completedTasks')} ({completedTasks.length})
              </Text>
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
      <Pressable style={[styles.fab, { bottom: tabBarHeight + 16 }]} onPress={openModal}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      {/* Add Task Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.modalTitle}>{t('tasks.addTask')}</Text>

                {/* Task Name */}
                <Text style={styles.label}>{t('tasks.taskName')}</Text>
                <TextInput
                  ref={nameRef}
                  style={styles.textInput}
                  placeholder={t('tasks.taskNamePlaceholder')}
                  value={taskName}
                  onChangeText={setTaskName}
                  returnKeyType="next"
                  onSubmitEditing={() => dayRef.current?.focus()}
                />

                {/* Deadline */}
                <Text style={styles.label}>{t('tasks.deadline')}</Text>
                <View style={styles.dateRow}>
                  <TextInput
                    ref={dayRef}
                    style={[segStyle, styles.segShort]}
                    placeholder="DD"
                    value={day}
                    onChangeText={setDay}
                    keyboardType="number-pad"
                    maxLength={2}
                    returnKeyType="next"
                    onSubmitEditing={() => monthRef.current?.focus()}
                  />
                  <Text style={styles.sep}>/</Text>
                  <TextInput
                    ref={monthRef}
                    style={[segStyle, styles.segShort]}
                    placeholder="MM"
                    value={month}
                    onChangeText={setMonth}
                    keyboardType="number-pad"
                    maxLength={2}
                    returnKeyType="next"
                    onSubmitEditing={() => yearRef.current?.focus()}
                  />
                  <Text style={styles.sep}>/</Text>
                  <TextInput
                    ref={yearRef}
                    style={[segStyle, styles.segYear]}
                    placeholder="YYYY"
                    value={year}
                    onChangeText={setYear}
                    keyboardType="number-pad"
                    maxLength={4}
                    returnKeyType="next"
                    onSubmitEditing={() => hourRef.current?.focus()}
                  />
                  <Text style={styles.sepWide} />
                  <TextInput
                    ref={hourRef}
                    style={[segStyle, styles.segShort]}
                    placeholder="HH"
                    value={hour}
                    onChangeText={setHour}
                    keyboardType="number-pad"
                    maxLength={2}
                    returnKeyType="next"
                    onSubmitEditing={() => minuteRef.current?.focus()}
                  />
                  <Text style={styles.sep}>:</Text>
                  <TextInput
                    ref={minuteRef}
                    style={[segStyle, styles.segShort]}
                    placeholder="MM"
                    value={minute}
                    onChangeText={setMinute}
                    keyboardType="number-pad"
                    maxLength={2}
                    returnKeyType="done"
                  />
                </View>

                {/* Difficulty */}
                <Text style={styles.label}>{t('tasks.difficulty')}</Text>
                <View style={styles.difficultyPicker}>
                  {Array.from({ length: 11 }, (_, i) => {
                    const level = i * 10;
                    const selected = level === difficulty;
                    let color = '#27ae60';
                    if (level > 60) color = '#e74c3c';
                    else if (level > 30) color = '#f39c12';
                    return (
                      <Pressable
                        key={level}
                        onPress={() => setDifficulty(level)}
                        style={[
                          styles.diffDot,
                          { backgroundColor: selected ? color : '#e8e8e8', borderColor: selected ? color : '#ccc' },
                        ]}
                      >
                        <Text style={[styles.diffDotLabel, selected && { color: '#fff' }]}>
                          {level}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Punishment */}
                <Text style={styles.label}>{t('tasks.punishment')}</Text>
                <Pressable style={styles.punishmentField} onPress={() => setPickerVisible(true)}>
                  <Text style={selectedPunishment ? styles.punishmentSelected : styles.punishmentPlaceholder}>
                    {selectedPunishment
                      ? `${PUNISHMENT_EMOJIS[selectedPunishment.type]} ${selectedPunishment.title}`
                      : t('tasks.selectPunishment')}
                  </Text>
                  <Text style={styles.punishmentArrow}>{'\u25BC'}</Text>
                </Pressable>

                {/* Actions */}
                <View style={styles.modalActions}>
                  <Pressable style={styles.cancelBtn} onPress={closeModal}>
                    <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                  </Pressable>
                  <Pressable style={styles.saveBtn} onPress={handleSave}>
                    <Text style={styles.saveBtnText}>{t('common.save')}</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* Punishment Picker Modal */}
      <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <Pressable style={styles.pickerOverlay} onPress={() => setPickerVisible(false)}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>{t('tasks.selectPunishment')}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {punishments.map((p) => {
                const isSelected = p.id === selectedPunishmentId;
                return (
                  <Pressable
                    key={p.id}
                    style={[styles.pickerRow, isSelected && styles.pickerRowSelected]}
                    onPress={() => {
                      setSelectedPunishmentId(p.id);
                      setPickerVisible(false);
                    }}
                  >
                    <Text style={styles.pickerEmoji}>{PUNISHMENT_EMOJIS[p.type]}</Text>
                    <Text style={[styles.pickerRowTitle, isSelected && styles.pickerRowTitleSelected]}>
                      {p.title}
                    </Text>
                    {isSelected && <Text style={styles.pickerCheck}>{'\u2705'}</Text>}
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
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  chevron: {
    fontSize: 12,
    color: '#999',
  },

  // TaskCard
  taskCard: {
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
  taskCardCompleted: {
    opacity: 0.7,
  },
  accentBar: {
    width: 4,
  },
  taskCardContent: {
    flex: 1,
    padding: 14,
  },
  taskCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    flexShrink: 1,
  },
  taskNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  lateBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lateBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeLate: {
    backgroundColor: '#fdedec',
  },
  statusBadgeOnTime: {
    backgroundColor: '#eafaf1',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  taskDeadline: {
    fontSize: 13,
    color: '#777',
    marginTop: 4,
  },
  taskRemaining: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
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
  taskPunishment: {
    fontSize: 13,
    color: '#888',
    marginTop: 6,
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    padding: 6,
  },
  actionBtnPressed: {
    opacity: 0.5,
  },
  completeBtn: {},
  giveUpBtn: {},
  deleteBtn: {},
  actionBtnText: {
    fontSize: 20,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6c5ce7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
    marginTop: -2,
  },

  // Add Task Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '90%',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 34,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginTop: 16,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1a2e',
    backgroundColor: '#f9f9f9',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    textAlign: 'center',
    fontSize: 16,
    paddingVertical: 10,
    color: '#1a1a2e',
  },
  segShort: {
    flex: 1,
  },
  segYear: {
    flex: 1.5,
  },
  sep: {
    fontSize: 20,
    color: '#999',
    marginHorizontal: 4,
  },
  sepWide: {
    width: 16,
  },
  difficultyPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  diffDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diffDotLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
  },
  punishmentField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
  },
  punishmentSelected: {
    fontSize: 15,
    color: '#1a1a2e',
    flex: 1,
  },
  punishmentPlaceholder: {
    fontSize: 15,
    color: '#bbb',
    flex: 1,
  },
  punishmentArrow: {
    fontSize: 12,
    color: '#999',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#777',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#6c5ce7',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  // Punishment Picker
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  pickerCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 34,
    maxHeight: '60%',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 12,
    textAlign: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  pickerRowSelected: {
    backgroundColor: '#f0edff',
    borderRadius: 8,
  },
  pickerEmoji: {
    fontSize: 22,
    marginRight: 12,
  },
  pickerRowTitle: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  pickerRowTitleSelected: {
    color: '#6c5ce7',
    fontWeight: '600',
  },
  pickerCheck: {
    fontSize: 18,
  },
});
