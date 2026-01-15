
export enum Category {
  Breakfast = '早餐',
  Lunch = '中餐',
  Dinner = '晚餐',
  Other = '其他'
}

export interface Expense {
  id: string;
  amount: number;
  timestamp: number; // Unix timestamp
  category: Category;
  note?: string;
  dateStr: string; // YYYY-MM-DD for grouping
}

export type ShiftMode = 'day' | 'night';

export interface WeekData {
  weekStartDate: string; // Monday's date YYYY-MM-DD
  
  // Refactored Budget Logic
  dailySubsidy: number; // Per day allowance (e.g., 28)
  budget: number; // Deprecated conceptually, but kept for legacy compat or calculated total
  
  workDays: Record<string, boolean>; // Key: dateStr, Value: Is this a subsidy-eligible day?

  hourlyRate: number; // Hourly wage
  shiftMode: ShiftMode; // 'day' or 'night'
  dailyHours: Record<string, number>; // Key is dateStr, Value is hours worked
  expenses: Expense[];
}

export interface AppState {
  currentDailySubsidySetting: number; // New setting
  currentHourlyRateSetting: number; 
  currentShiftSetting: ShiftMode; 
  weeks: Record<string, WeekData>;
  // Removed WebDAV config
}

export const STORAGE_KEY = 'weekly_keeper_data_v4'; // Bump version