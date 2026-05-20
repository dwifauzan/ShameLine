import { t } from '../i18n';

export function getUrgencyColor(deadline: number): string {
  const now = Date.now();
  const diff = deadline - now;
  const hours = diff / (1000 * 60 * 60);

  if (diff <= 0 || hours < 1) return '#e74c3c';
  if (hours < 6) return '#f39c12';
  if (hours < 24) return '#f1c40f';
  if (hours < 72) return '#27ae60';
  return '#95a5a6';
}

export function formatTimeRemaining(deadline: number): string {
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

export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatLateBy(deadline: number, completedAt: number | null): string {
  if (!completedAt) return '';
  const diff = completedAt - deadline;
  if (diff <= 0) return '';
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0 && hours > 0) return `${days}${t('hallOfShame.daysShort')} ${hours}${t('hallOfShame.hoursShort')}`;
  if (days > 0) return `${days}${t('hallOfShame.daysShort')}`;
  return `${hours}${t('hallOfShame.hoursShort')}`;
}

export function formatLongestRecord(hours: number): string {
  if (hours <= 0) return '-';
  const days = Math.floor(hours / 24);
  const h = hours % 24;
  if (days > 0 && h > 0) return `${days}${t('hallOfShame.daysShort')} ${h}${t('hallOfShame.hoursShort')}`;
  if (days > 0) return `${days}${t('hallOfShame.daysShort')}`;
  return `${hours}${t('hallOfShame.hoursShort')}`;
}
