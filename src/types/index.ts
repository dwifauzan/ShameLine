export type TaskStatus = 'active' | 'completed' | 'archived';

export type PunishmentType = 'whatsapp' | 'wallpaper' | 'youtube' | 'alarm';

export interface Task {
  id: string;
  name: string;
  deadline: number; // timestamp
  difficulty: number; // 0-100
  punishmentId: string;
  status: TaskStatus;
  completedAt: number | null;
  givenUp: boolean;
  replacementTaskId: string | null;
  createdAt: number;
}

export interface Punishment {
  id: string;
  type: PunishmentType;
  title: string;
  message: string;
  isCustom: boolean;
  useCount: number;
}

export interface AppStats {
  weeklyLateCount: number;
  totalCompleted: number;
  totalGivenUp: number;
  longestLateHours: number;
  mostUsedPunishmentId: string | null;
}
