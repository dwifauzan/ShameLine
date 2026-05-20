import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { t } from '../i18n';
import { Punishment } from '../types';
import { PUNISHMENT_EMOJIS } from '../utils/constants';

interface PunishmentPickerModalProps {
  visible: boolean;
  punishments: Punishment[];
  selectedPunishmentId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export default function PunishmentPickerModal({
  visible,
  punishments,
  selectedPunishmentId,
  onSelect,
  onClose,
}: PunishmentPickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.pickerOverlay} onPress={onClose}>
        <View style={styles.pickerCard}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{t('tasks.selectPunishment')}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.pickerClose}>✕</Text>
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
                    onSelect(p.id);
                    onClose();
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
                  {isSelected && <Text style={styles.pickerOptionCheck}>✓</Text>}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
