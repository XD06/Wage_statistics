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

export interface WeekData {
  weekStartDate: string; // Monday's date YYYY-MM-DD
  budget: number; // Now acts as "Weekly Meal Subsidy"
  hourlyRate: number; // New: Hourly wage for this week
  dailyHours: Record<string, number>; // New: Key is dateStr, Value is hours worked
  expenses: Expense[];
}

export interface AppState {
  currentBudgetSetting: number; // Default meal subsidy
  currentHourlyRateSetting: number; // New: Default hourly rate
  weeks: Record<string, WeekData>; // Keyed by Monday's YYYY-MM-DD
}

export const STORAGE_KEY = 'weekly_keeper_data_v2'; // Bump version
