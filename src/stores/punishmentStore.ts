import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Punishment } from '../types';
import { STORAGE_KEYS, DEFAULT_PUNISHMENTS } from '../utils/constants';

interface PunishmentState {
  punishments: Punishment[];
  addCustomPunishment: (punishment: Omit<Punishment, 'id' | 'isCustom' | 'useCount'>) => void;
  deleteCustomPunishment: (id: string) => void;
  incrementUseCount: (id: string) => void;
}

export const usePunishmentStore = create<PunishmentState>()(
  persist(
    (set) => ({
      punishments: DEFAULT_PUNISHMENTS,

      addCustomPunishment: (punishmentData) => {
        const newPunishment: Punishment = {
          ...punishmentData,
          id: `punishment-custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          isCustom: true,
          useCount: 0,
        };
        set((state) => ({
          punishments: [...state.punishments, newPunishment],
        }));
      },

      deleteCustomPunishment: (id) => {
        set((state) => ({
          punishments: state.punishments.filter((p) => p.id !== id),
        }));
      },

      incrementUseCount: (id) => {
        set((state) => ({
          punishments: state.punishments.map((p) =>
            p.id === id ? { ...p, useCount: p.useCount + 1 } : p
          ),
        }));
      },
    }),
    {
      name: STORAGE_KEYS.PUNISHMENTS,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
