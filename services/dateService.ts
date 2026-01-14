import { WeekData } from '../types';

export const getMonday = (d: Date): Date => {
  const date = new Date(d);
  const day = date.getDay();
  // If Sunday (0), we consider it part of the *next* week logic per requirements?
  // Requirement 5.1: "If today is Sunday, system should show next week data"
  // Requirement 2: Week is Mon-Sat.
  
  // Logic: 
  // If today is Sunday (0), the "Current Week" starts tomorrow (Monday).
  // If today is Mon-Sat (1-6), the "Current Week" started on the previous Monday (or today).
  
  const diff = date.getDate() - day + (day === 0 ? 1 : -6); 
  // Wait, standard getMonday:
  // If day is 0 (Sun), Monday is date + 1.
  // If day is 1 (Mon), Monday is date.
  // If day is 6 (Sat), Monday is date - 5.
  
  const currentDay = day === 0 ? 7 : day; // Treat Sunday as 7 for calc
  // However, Requirement 5.1 says: "If today is Sunday, show next week".
  // So if Sunday, Monday is Tomorrow.
  
  if (day === 0) {
      const nextMon = new Date(date);
      nextMon.setDate(date.getDate() + 1);
      nextMon.setHours(0, 0, 0, 0);
      return nextMon;
  }

  const diffToMon = date.getDate() - (currentDay - 1);
  const monday = new Date(date);
  monday.setDate(diffToMon);
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
  end.setDate(start.getDate() + 5); // Saturday
  
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
