
import { WeekData } from '../types';

export const getMonday = (d: Date): Date => {
  const date = new Date(d);
  const day = date.getDay(); // 0 is Sunday
  
  // Logic: Week is Mon (1) to Sun (7).
  // If day is 0 (Sun), Monday was 6 days ago.
  // If day is 1 (Mon), Monday is today (0 days ago).
  // If day is 2 (Tue), Monday was 1 day ago.
  const diffToMon = day === 0 ? 6 : day - 1;

  const monday = new Date(date);
  monday.setDate(date.getDate() - diffToMon);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

export const formatDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const formatDisplayDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

export const isSunday = (date: Date): boolean => {
  return date.getDay() === 0;
};

export const getWeekRangeDisplay = (mondayStr: string): string => {
  const start = new Date(mondayStr);
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Sunday is end
  
  const y1 = start.getFullYear();
  const m1 = start.getMonth() + 1;
  const d1 = start.getDate();
  
  const y2 = end.getFullYear();
  const m2 = end.getMonth() + 1;
  const d2 = end.getDate();

  if (y1 === y2) {
      return `${y1}年${m1}月${d1}日 - ${m2}月${d2}日`;
  }
  return `${y1}年${m1}月${d1}日 - ${y2}年${m2}月${d2}日`;
};

export const formatTime = (date: Date): string => {
  return date.toTimeString().slice(0, 5);
};
