import React from 'react';
import {
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
import * as Haptics from 'expo-haptics';
import { t } from '../i18n';
import { Punishment } from '../types';
import { PUNISHMENT_EMOJIS } from '../utils/constants';

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  onOpenPicker: () => void;
  selectedPunishment: Punishment | undefined;
  formState: {
    taskName: string;
    day: string;
    month: string;
    year: string;
    hour: string;
    minute: string;
    difficulty: number;
  };
  setters: {
    setTaskName: (val: string) => void;
    setDay: (val: string) => void;
    setMonth: (val: string) => void;
    setYear: (val: string) => void;
    setHour: (val: string) => void;
    setMinute: (val: string) => void;
    setDifficulty: (val: number) => void;
  };
  refs: {
    nameRef: React.RefObject<TextInput>;
    dayRef: React.RefObject<TextInput>;
    monthRef: React.RefObject<TextInput>;
    yearRef: React.RefObject<TextInput>;
    hourRef: React.RefObject<TextInput>;
    minuteRef: React.RefObject<TextInput>;
  };
}

export default function AddTaskModal({
  visible,
  onClose,
  onSave,
  onOpenPicker,
  selectedPunishment,
  formState,
  setters,
  refs,
}: AddTaskModalProps) {
  const isFormValid = formState.taskName.trim().length > 0 && !!selectedPunishment;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContainer}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <View style={styles.headerTitleRow}>
                <Text style={styles.modalTitle}>{t('tasks.addTask')}</Text>
                <Pressable onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </Pressable>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalScroll}
            >
              {/* Task Name Input */}
              <View style={styles.section}>
                <Text style={styles.label}>{t('tasks.taskName')}</Text>
                <TextInput
                  ref={refs.nameRef}
                  style={styles.mainInput}
                  placeholder={t('tasks.taskNamePlaceholder')}
                  value={formState.taskName}
                  onChangeText={setters.setTaskName}
                  placeholderTextColor="#A0A0A0"
                  selectionColor="#6C5CE7"
                />
              </View>

              {/* Deadline Selection */}
              <View style={styles.section}>
                <Text style={styles.label}>{t('tasks.deadline')}</Text>
                <View style={styles.deadlineGrid}>
                  <View style={styles.deadlineGroup}>
                    <Text style={styles.subLabel}>Date</Text>
                    <View style={styles.dateInputsContainer}>
                      <TextInput
                        ref={refs.dayRef}
                        style={styles.compactInput}
                        placeholder="DD"
                        value={formState.day}
                        onChangeText={(val) => {
                          setters.setDay(val);
                          if (val.length === 2) refs.monthRef.current?.focus();
                        }}
                        keyboardType="number-pad"
                        maxLength={2}
                      />
                      <Text style={styles.slash}>/</Text>
                      <TextInput
                        ref={refs.monthRef}
                        style={styles.compactInput}
                        placeholder="MM"
                        value={formState.month}
                        onChangeText={(val) => {
                          setters.setMonth(val);
                          if (val.length === 2) refs.yearRef.current?.focus();
                        }}
                        keyboardType="number-pad"
                        maxLength={2}
                      />
                    </View>
                  </View>

                  <View style={styles.deadlineGroup}>
                    <Text style={styles.subLabel}>Time</Text>
                    <View style={styles.dateInputsContainer}>
                      <TextInput
                        ref={refs.hourRef}
                        style={styles.compactInput}
                        placeholder="HH"
                        value={formState.hour}
                        onChangeText={(val) => {
                          setters.setHour(val);
                          if (val.length === 2) refs.minuteRef.current?.focus();
                        }}
                        keyboardType="number-pad"
                        maxLength={2}
                      />
                      <Text style={styles.slash}>:</Text>
                      <TextInput
                        ref={refs.minuteRef}
                        style={styles.compactInput}
                        placeholder="MM"
                        value={formState.minute}
                        onChangeText={setters.setMinute}
                        keyboardType="number-pad"
                        maxLength={2}
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* Difficulty Level */}
              <View style={styles.section}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>{t('tasks.difficulty')}</Text>
                  <Text style={[styles.difficultyValue, { color: getDifficultyColor(formState.difficulty) }]}>
                    {formState.difficulty}%
                  </Text>
                </View>
                <View style={styles.difficultyTrack}>
                  {[0, 25, 50, 75, 100].map((level) => (
                    <Pressable
                      key={level}
                      onPress={() => {
                        setters.setDifficulty(level);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={[
                        styles.difficultyPill,
                        formState.difficulty === level && {
                          backgroundColor: getDifficultyColor(level),
                          borderColor: getDifficultyColor(level),
                        }
                      ]}
                    >
                      <Text style={[
                        styles.difficultyPillText,
                        formState.difficulty === level && styles.difficultyPillTextActive
                      ]}>
                        {level === 0 ? 'Easy' : level === 100 ? 'Hard' : level}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Punishment Selector */}
              <View style={styles.section}>
                <Text style={styles.label}>{t('tasks.punishment')}</Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.punishmentCard,
                    selectedPunishment && styles.punishmentCardSelected,
                    pressed && { opacity: 0.8 }
                  ]}
                  onPress={onOpenPicker}
                >
                  {selectedPunishment ? (
                    <View style={styles.punishmentContent}>
                      <View style={styles.punishmentIconWrapper}>
                        <Text style={styles.punishmentEmoji}>
                          {PUNISHMENT_EMOJIS[selectedPunishment.type]}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.punishmentTitle}>{selectedPunishment.title}</Text>
                        <Text style={styles.punishmentMessage} numberOfLines={1}>
                          {selectedPunishment.message}
                        </Text>
                      </View>
                      <Text style={styles.changeText}>Change</Text>
                    </View>
                  ) : (
                    <View style={styles.punishmentPlaceholder}>
                      <Text style={styles.placeholderEmoji}>😱</Text>
                      <Text style={styles.placeholderText}>{t('tasks.selectPunishment')}</Text>
                    </View>
                  )}
                </Pressable>
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>

            <View style={styles.footer}>
              <Pressable
                style={[styles.saveButton, !isFormValid && styles.saveButtonDisabled]}
                onPress={onSave}
                disabled={!isFormValid}
              >
                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function getDifficultyColor(level: number) {
  if (level <= 30) return '#27AE60';
  if (level <= 60) return '#F39C12';
  return '#EB5757';
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '600',
  },
  modalScroll: {
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mainInput: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A2E',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
  },
  deadlineGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  deadlineGroup: {
    flex: 1,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C7C7CC',
    marginBottom: 6,
    marginLeft: 4,
  },
  dateInputsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
  },
  compactInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  slash: {
    fontSize: 16,
    color: '#D1D1D6',
    fontWeight: '600',
  },
  difficultyValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  difficultyTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 6,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
  },
  difficultyPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8E93',
  },
  difficultyPillTextActive: {
    color: '#FFFFFF',
  },
  punishmentCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    borderStyle: 'dashed',
    minHeight: 80,
    justifyContent: 'center',
  },
  punishmentCardSelected: {
    borderColor: '#6C5CE7',
    backgroundColor: '#F0EDFF',
    borderStyle: 'solid',
  },
  punishmentPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  placeholderEmoji: {
    fontSize: 24,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C5CE7',
  },
  punishmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  punishmentIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  punishmentEmoji: {
    fontSize: 24,
  },
  punishmentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  punishmentMessage: {
    fontSize: 13,
    color: '#777777',
    marginTop: 2,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6C5CE7',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    overflow: 'hidden',
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  saveButton: {
    backgroundColor: '#6C5CE7',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  saveButtonDisabled: {
    backgroundColor: '#E5E5EA',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
