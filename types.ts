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
  budget: number; // Weekly Meal Subsidy (e.g., 168)
  hourlyRate: number; // Hourly wage
  shiftMode: ShiftMode; // New: 'day' or 'night'
  dailyHours: Record<string, number>; // Key is dateStr, Value is hours worked
  expenses: Expense[];
}

export interface AppState {
  currentBudgetSetting: number; 
  currentHourlyRateSetting: number; 
  currentShiftSetting: ShiftMode; // New: Default shift preference
  weeks: Record<string, WeekData>; 
}

export const STORAGE_KEY = 'weekly_keeper_data_v3'; // Bump version
