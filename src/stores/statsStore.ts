import { create } from 'zustand';
import { AppStats } from '../types';
import { useTaskStore } from './taskStore';
import { usePunishmentStore } from './punishmentStore';

interface StatsState {
  stats: AppStats;
  computeStats: () => void;
}

const initialStats: AppStats = {
  weeklyLateCount: 0,
  totalCompleted: 0,
  totalGivenUp: 0,
  longestLateHours: 0,
  mostUsedPunishmentId: null,
};

export const useStatsStore = create<StatsState>()((set) => ({
  stats: initialStats,

  computeStats: () => {
    const tasks = useTaskStore.getState().tasks;
    const punishments = usePunishmentStore.getState().punishments;

    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const weeklyLateCount = tasks.filter(
      (task) => task.givenUp && task.completedAt && task.completedAt > oneWeekAgo
    ).length;

    const totalCompleted = tasks.filter((task) => task.status === 'completed').length;
    const totalGivenUp = tasks.filter((task) => task.givenUp).length;

    let longestLateHours = 0;
    for (const task of tasks) {
      if (task.givenUp && task.deadline) {
        const lateHours = (task.completedAt || now - task.createdAt) - task.deadline;
        const hours = Math.floor(lateHours / (1000 * 60 * 60));
        if (hours > longestLateHours) longestLateHours = hours;
      }
    }

    let mostUsedPunishmentId: string | null = null;
    let maxUseCount = 0;
    for (const punishment of punishments) {
      if (punishment.useCount > maxUseCount) {
        maxUseCount = punishment.useCount;
        mostUsedPunishmentId = punishment.id;
      }
    }

    set({
      stats: {
        weeklyLateCount,
        totalCompleted,
        totalGivenUp,
        longestLateHours,
        mostUsedPunishmentId,
      },
    });
  },
}));
