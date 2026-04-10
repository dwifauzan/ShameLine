import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, TaskStatus } from '../types';
import { STORAGE_KEYS } from '../utils/constants';

interface TaskState {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'status' | 'completedAt' | 'givenUp' | 'replacementTaskId' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  markCompleted: (id: string) => void;
  giveUp: (id: string) => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: [],

      addTask: (taskData) => {
        const newTask: Task = {
          ...taskData,
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: 'active' as TaskStatus,
          completedAt: null,
          givenUp: false,
          replacementTaskId: null,
          createdAt: Date.now(),
        };
        set((state) => ({ tasks: [...state.tasks, newTask] }));
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates } : task
          ),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
      },

      markCompleted: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, status: 'completed' as TaskStatus, completedAt: Date.now() }
              : task
          ),
        }));
      },

      giveUp: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, status: 'archived' as TaskStatus, givenUp: true, completedAt: Date.now() }
              : task
          ),
        }));
      },
    }),
    {
      name: STORAGE_KEYS.TASKS,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
