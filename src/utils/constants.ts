import { Punishment } from '../types';

export const STORAGE_KEYS = {
  TASKS: 'task-storage',
  PUNISHMENTS: 'punishment-storage',
  LANGUAGE: 'language-preference',
} as const;

export const DEFAULT_PUNISHMENTS: Punishment[] = [
  {
    id: 'punishment-whatsapp',
    type: 'whatsapp',
    title: 'WhatsApp Blast',
    message: 'Kirim pesan memalukan ke 5 kontak acak di WhatsApp!',
    isCustom: false,
    useCount: 0,
  },
  {
    id: 'punishment-wallpaper',
    type: 'wallpaper',
    title: 'Wallpaper Memalukan',
    message: 'Ganti wallpaper HP kamu dengan foto memalukan selama 24 jam!',
    isCustom: false,
    useCount: 0,
  },
  {
    id: 'punishment-youtube',
    type: 'youtube',
    title: 'Video Challenge',
    message: 'Rekam video challenge memalukan dan posting ke story!',
    isCustom: false,
    useCount: 0,
  },
  {
    id: 'punishment-alarm',
    type: 'alarm',
    title: 'Alarm Malu',
    message: 'Pasang alarm dengan nada paling memalukan di jam ramai!',
    isCustom: false,
    useCount: 0,
  },
];
