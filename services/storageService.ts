import { AppState, STORAGE_KEY, WeekData } from '../types';

const INITIAL_STATE: AppState = {
  currentBudgetSetting: 168, 
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
    
    // Migrate weeks
    if (data.weeks) {
       Object.keys(data.weeks).forEach(key => {
          if (data.weeks[key].hourlyRate === undefined) data.weeks[key].hourlyRate = 0;
          if (data.weeks[key].dailyHours === undefined) data.weeks[key].dailyHours = {};
          if (data.weeks[key].shiftMode === undefined) data.weeks[key].shiftMode = 'day';
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
