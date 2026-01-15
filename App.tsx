import React, { useEffect, useState } from 'react';
import { LayoutDashboard, History as HistoryIcon, Upload } from 'lucide-react';
import { AppState, Category, Expense, WeekData, STORAGE_KEY, ShiftMode } from './types';
import { loadData, saveData } from './services/storageService';
import { formatTime, getMonday, formatDateKey, isSunday } from './services/dateService';
import Dashboard from './components/Dashboard';
import History from './components/History';
import BudgetModal from './components/BudgetModal';

enum View {
  Dashboard = 'dashboard',
  History = 'history'
}

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.Dashboard);
  const [data, setData] = useState<AppState>(loadData());
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  // Determine current week key
  const today = new Date();
  const currentWeekMonday = getMonday(today);
  const currentWeekKey = formatDateKey(currentWeekMonday);
  const todayStr = today.toISOString().split('T')[0];

  useEffect(() => {
    // Initialization logic for new week
    setData(prev => {
      // If this week doesn't exist, create it
      if (!prev.weeks[currentWeekKey]) {
        return {
          ...prev,
          weeks: {
            ...prev.weeks,
            [currentWeekKey]: {
              weekStartDate: currentWeekKey,
              budget: prev.currentBudgetSetting, 
              hourlyRate: prev.currentHourlyRateSetting || 0,
              shiftMode: prev.currentShiftSetting || 'day', // Inherit setting
              dailyHours: {},
              expenses: []
            }
          }
        };
      }
      return prev;
    });
  }, [currentWeekKey]);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const handleSetSettings = (budget: number, hourlyRate: number, shift: ShiftMode) => {
    setData(prev => ({
      ...prev,
      currentBudgetSetting: budget, 
      currentHourlyRateSetting: hourlyRate,
      currentShiftSetting: shift,
      weeks: {
        ...prev.weeks,
        [currentWeekKey]: {
          ...prev.weeks[currentWeekKey],
          budget: budget,
          hourlyRate: hourlyRate,
          shiftMode: shift
        }
      }
    }));
  };

  const handleUpdateWorkHours = (hours: number) => {
      setData(prev => {
          const weekData = prev.weeks[currentWeekKey];
          return {
              ...prev,
              weeks: {
                  ...prev.weeks,
                  [currentWeekKey]: {
                      ...weekData,
                      dailyHours: {
                          ...weekData.dailyHours,
                          [todayStr]: hours
                      }
                  }
              }
          };
      });
  };

  const handleUpdateHistoryHours = (weekKey: string, dateStr: string, hours: number) => {
      setData(prev => ({
          ...prev,
          weeks: {
              ...prev.weeks,
              [weekKey]: {
                  ...prev.weeks[weekKey],
                  dailyHours: {
                      ...prev.weeks[weekKey].dailyHours,
                      [dateStr]: hours
                  }
              }
          }
      }));
  };

  const handleAddExpense = (amount: number, category: Category | null, note: string, time: string) => {
    const expenseDate = new Date();
    const [hours, mins] = time.split(':').map(Number);
    expenseDate.setHours(hours, mins);

    const currentWeekData = data.weeks[currentWeekKey];
    const isNightShift = currentWeekData?.shiftMode === 'night';

    // Auto Categorization Logic
    let finalCategory = category;
    if (!finalCategory) {
      const h = hours + mins / 60;
      
      if (isNightShift) {
          // Night Shift Logic (Opposite roughly)
          // "Breakfast" (Start of shift) ~ 7pm-9pm (19-21)
          // "Lunch" (Mid shift) ~ 11pm-1am (23-1) or (23-25)
          // "Dinner" (End of shift) ~ 6am-8am
          
          if (h >= 18.5 && h <= 21) finalCategory = Category.Breakfast; // "Start meal"
          else if (h >= 23 || h <= 2) finalCategory = Category.Lunch;   // "Mid meal"
          else if (h >= 6 && h <= 8) finalCategory = Category.Dinner;   // "End meal"
          else finalCategory = Category.Other;

      } else {
          // Day Shift Logic
          if (h >= 7.5 && h <= 8.5) finalCategory = Category.Breakfast;
          else if (h >= 11 && h <= 12) finalCategory = Category.Lunch;
          else if (h >= 17 && h <= 18) finalCategory = Category.Dinner;
          else finalCategory = Category.Other;
      }
    }

    const newExpense: Expense = {
      id: crypto.randomUUID(),
      amount,
      category: finalCategory,
      note,
      timestamp: expenseDate.getTime(),
      dateStr: formatDateKey(expenseDate)
    };

    setData(prev => {
      const week = prev.weeks[currentWeekKey] || {
        weekStartDate: currentWeekKey,
        budget: prev.currentBudgetSetting,
        hourlyRate: prev.currentHourlyRateSetting || 0,
        shiftMode: prev.currentShiftSetting || 'day',
        dailyHours: {},
        expenses: []
      };

      return {
        ...prev,
        weeks: {
          ...prev.weeks,
          [currentWeekKey]: {
            ...week,
            expenses: [newExpense, ...week.expenses]
          }
        }
      };
    });
  };

  const handleDeleteExpense = (weekKey: string, id: string) => {
      if(!window.confirm("确定要删除这条记录吗？")) return;
      
      setData(prev => ({
          ...prev,
          weeks: {
              ...prev.weeks,
              [weekKey]: {
                  ...prev.weeks[weekKey],
                  expenses: prev.weeks[weekKey].expenses.filter(e => e.id !== id)
              }
          }
      }));
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              if (json.weeks) {
                  if(window.confirm("导入将覆盖当前数据，是否继续？")) {
                      setData(json);
                      alert("导入成功！");
                  }
              } else {
                  alert("文件格式不正确");
              }
          } catch (err) {
              alert("文件解析失败");
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  const currentWeekData = data.weeks[currentWeekKey] || {
    weekStartDate: currentWeekKey,
    budget: 0,
    hourlyRate: 0,
    shiftMode: 'day',
    dailyHours: {},
    expenses: []
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full md:max-w-md bg-white/50 min-h-screen shadow-2xl relative flex flex-col">
        
        {/* Header */}
        <header className="pt-8 pb-4 px-6 bg-white sticky top-0 z-10 border-b border-gray-100 backdrop-blur-md bg-white/90">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">WeeklyKeeper</h1>
                    <p className="text-xs text-gray-400 font-medium">工时与收支管理</p>
                </div>
                <label className="p-2 text-gray-400 hover:text-blue-600 cursor-pointer transition-colors">
                    <Upload size={20} />
                    <input type="file" className="hidden" accept=".json" onChange={handleFileImport} />
                </label>
            </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 no-scrollbar">
            {view === View.Dashboard ? (
                <Dashboard 
                    weekData={currentWeekData} 
                    onAddExpense={handleAddExpense}
                    onDeleteExpense={(id) => handleDeleteExpense(currentWeekKey, id)}
                    onUpdateWorkHours={handleUpdateWorkHours}
                    onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
                />
            ) : (
                <History 
                    data={data}
                    onDeleteExpense={handleDeleteExpense}
                    onUpdateHistoryHours={handleUpdateHistoryHours}
                />
            )}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 md:absolute w-full md:w-auto md:max-w-md left-0 right-0 mx-auto bg-white border-t border-gray-100 pb-safe pt-2 px-6 flex justify-around items-center z-20 pb-6">
            <button 
                onClick={() => setView(View.Dashboard)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl w-24 transition-all ${view === View.Dashboard ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`}
            >
                <LayoutDashboard size={24} strokeWidth={view === View.Dashboard ? 2.5 : 2} />
                <span className="text-[10px] font-bold">今日</span>
            </button>
            <button 
                onClick={() => setView(View.History)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl w-24 transition-all ${view === View.History ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`}
            >
                <HistoryIcon size={24} strokeWidth={view === View.History ? 2.5 : 2} />
                <span className="text-[10px] font-bold">记录</span>
            </button>
        </nav>

        <BudgetModal 
            isOpen={isBudgetModalOpen} 
            onClose={() => setIsBudgetModalOpen(false)} 
            currentBudget={currentWeekData.budget}
            currentHourlyRate={currentWeekData.hourlyRate || 0}
            currentShift={currentWeekData.shiftMode || 'day'}
            onSave={handleSetSettings}
        />

      </div>
    </div>
  );
};

export default App;