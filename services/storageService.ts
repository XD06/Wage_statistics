
import { AppState, STORAGE_KEY, WeekData } from '../types';

const INITIAL_STATE: AppState = {
  currentDailySubsidySetting: 28, 
  currentHourlyRateSetting: 0,
  currentShiftSetting: 'day',
  weeks: {}
};

export const loadData = (): AppState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const data = JSON.parse(raw);
    
    // Migration helper
    if (data.currentHourlyRateSetting === undefined) data.currentHourlyRateSetting = 0;
    if (data.currentShiftSetting === undefined) data.currentShiftSetting = 'day';
    
    // Migrate from old budget (total) to daily subsidy
    if (data.currentDailySubsidySetting === undefined) {
        // If old 'currentBudgetSetting' exists (e.g., 168), divide by 6, else default 28
        const oldBudget = (data as any).currentBudgetSetting;
        data.currentDailySubsidySetting = oldBudget ? oldBudget / 6 : 28;
    }

    // Migrate weeks
    if (data.weeks) {
       Object.keys(data.weeks).forEach(key => {
          const week = data.weeks[key];
          if (week.hourlyRate === undefined) week.hourlyRate = 0;
          if (week.dailyHours === undefined) week.dailyHours = {};
          if (week.shiftMode === undefined) week.shiftMode = 'day';
          
          // Migrate budget to daily subsidy for existing weeks
          if (week.dailySubsidy === undefined) {
             week.dailySubsidy = week.budget ? week.budget / 6 : 28;
          }
          
          // Initialize workDays if missing. 
          // Default: Assume existing days with hours or Mon-Sat are work days
          if (week.workDays === undefined) {
              week.workDays = {};
              // Simple migration: mark Mon-Sat as true
              // We can infer dates from the week key
              const startDate = new Date(key);
              for(let i=0; i<6; i++) {
                  const d = new Date(startDate);
                  d.setDate(startDate.getDate() + i);
                  const dKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                  week.workDays[dKey] = true; 
              }
          }
       });
    }

    return data;
  } catch (e) {
    console.error("Failed to load data", e);
    return INITIAL_STATE;
  }
};

export const saveData = (data: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save data", e);
    alert("存储空间不足，数据保存失败");
  }
};

export const exportData = (data: AppState) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `weekly_keeper_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
