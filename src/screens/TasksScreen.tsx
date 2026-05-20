import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { t } from '../i18n';
import { useTasks } from '../hooks/useTasks';
import { useTaskForm } from '../hooks/useTaskForm';
import { usePunishmentStore } from '../stores/punishmentStore';
import AddTaskModal from '../components/AddTaskModal';
import PunishmentPickerModal from '../components/PunishmentPickerModal';
import TaskCard from '../components/TaskCard';

export default function TasksScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const {
    activeTasks,
    completedTasks,
    punishmentMap,
    handleComplete,
    handleGiveUp,
    handleDelete,
  } = useTasks();

  const punishments = usePunishmentStore((s) => s.punishments);

  const [modalVisible, setModalVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [completedExpanded, setCompletedExpanded] = useState(false);

  const closeModal = useCallback(() => setModalVisible(false), []);
  const { formState, setters, refs, resetForm, validateAndSave } = useTaskForm();

  const openModal = useCallback(() => {
    resetForm();
    setModalVisible(true);
    setTimeout(() => refs.nameRef.current?.focus(), 300);
  }, [resetForm, refs.nameRef]);

  const handleSave = useCallback(() => {
    if (validateAndSave()) {
      closeModal();
    }
  }, [validateAndSave, closeModal]);

  const selectedPunishment = formState.selectedPunishmentId
    ? punishmentMap.get(formState.selectedPunishmentId)
    : undefined;

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
            <Text style={styles.emptyIcon}>📋</Text>
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
              <Text style={styles.chevron}>{completedExpanded ? '▲' : '▼'}</Text>
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

      <AddTaskModal
        visible={modalVisible}
        onClose={closeModal}
        onSave={handleSave}
        onOpenPicker={() => setPickerVisible(true)}
        selectedPunishment={selectedPunishment}
        formState={formState}
        setters={setters}
        refs={refs}
        punishments={punishments}
      />

      <PunishmentPickerModal
        visible={pickerVisible}
        punishments={punishments}
        selectedPunishmentId={formState.selectedPunishmentId}
        onSelect={setters.setSelectedPunishmentId}
        onClose={() => setPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

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
});
