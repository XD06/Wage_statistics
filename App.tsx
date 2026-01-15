import React, { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, History as HistoryIcon, Upload, Sparkles, Server } from 'lucide-react';
import { AppState, Category, Expense, WeekData, STORAGE_KEY, ShiftMode } from './types';
import { loadData, saveData } from './services/storageService';
import { saveToServer, loadFromServer } from './services/apiService';
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
  const [serverConnected, setServerConnected] = useState(false);
  
  // Ref to debounce uploads
  const uploadTimeoutRef = useRef<number | null>(null);

  const [viewingDate, setViewingDate] = useState<Date>(new Date());
  const viewingWeekMonday = getMonday(viewingDate);
  const viewingWeekKey = formatDateKey(viewingWeekMonday);
  const viewingDateStr = formatDateKey(viewingDate);

  // Initial Load from Server (Priority over LocalStorage)
  useEffect(() => {
      loadFromServer().then(serverData => {
          if (serverData) {
              console.log("Loaded data from server");
              setData(serverData);
              setServerConnected(true);
          } else {
              // Try check if server is reachable even if 404
              setServerConnected(true); 
          }
      }).catch(err => {
          console.error("Server unreachable", err);
          setServerConnected(false);
      });
  }, []);

  // Initialize data for the viewing week if it doesn't exist
  useEffect(() => {
    setData(prev => {
      if (!prev.weeks[viewingWeekKey]) {
        const defaultWorkDays: Record<string, boolean> = {};
        for (let i = 0; i < 6; i++) {
            const d = new Date(viewingWeekMonday);
            d.setDate(viewingWeekMonday.getDate() + i);
            const key = formatDateKey(d);
            defaultWorkDays[key] = true;
        }

        return {
          ...prev,
          weeks: {
            ...prev.weeks,
            [viewingWeekKey]: {
              weekStartDate: viewingWeekKey,
              dailySubsidy: prev.currentDailySubsidySetting,
              budget: prev.currentDailySubsidySetting * 6,
              hourlyRate: prev.currentHourlyRateSetting || 0,
              shiftMode: prev.currentShiftSetting || 'day',
              dailyHours: {},
              expenses: [],
              workDays: defaultWorkDays
            }
          }
        };
      }
      return prev;
    });
  }, [viewingWeekKey]);

  useEffect(() => {
    // 1. Save to LocalStorage immediately
    saveData(data);

    // 2. Trigger Server upload (Debounced)
    if (uploadTimeoutRef.current) {
        window.clearTimeout(uploadTimeoutRef.current);
    }
    uploadTimeoutRef.current = window.setTimeout(() => {
        saveToServer(data).then(success => {
            setServerConnected(success);
        });
    }, 2000); // 2 second debounce
  }, [data]);

  const handleSetSettings = (dailySubsidy: number, hourlyRate: number, shift: ShiftMode) => {
    setData(prev => ({
      ...prev,
      currentDailySubsidySetting: dailySubsidy, 
      currentHourlyRateSetting: hourlyRate,
      currentShiftSetting: shift,
      weeks: {
        ...prev.weeks,
        [viewingWeekKey]: {
          ...prev.weeks[viewingWeekKey],
          dailySubsidy: dailySubsidy,
          hourlyRate: hourlyRate,
          shiftMode: shift
        }
      }
    }));
  };

  const handleRestoreData = (newData: AppState) => {
      setData(newData);
      alert("数据已从服务器恢复！");
  };

  const handleUpdateWorkHours = (hours: number) => {
      setData(prev => {
          const weekData = prev.weeks[viewingWeekKey];
          return {
              ...prev,
              weeks: {
                  ...prev.weeks,
                  [viewingWeekKey]: {
                      ...weekData,
                      dailyHours: {
                          ...weekData.dailyHours,
                          [viewingDateStr]: hours
                      }
                  }
              }
          };
      });
  };
  
  const handleToggleWorkDay = (dateStr: string, isWork: boolean) => {
      setData(prev => {
          const weekData = prev.weeks[viewingWeekKey];
          return {
              ...prev,
              weeks: {
                  ...prev.weeks,
                  [viewingWeekKey]: {
                      ...weekData,
                      workDays: {
                          ...weekData.workDays,
                          [dateStr]: isWork
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
    const [hours, mins] = time.split(':').map(Number);
    const expenseDate = new Date(viewingDate); 
    expenseDate.setHours(hours, mins, 0, 0);

    const currentWeekData = data.weeks[viewingWeekKey];
    const isNightShift = currentWeekData?.shiftMode === 'night';

    let finalCategory = category;
    if (!finalCategory) {
      const h = hours + mins / 60;
      if (isNightShift) {
          if (h >= 18.5 && h <= 21) finalCategory = Category.Breakfast;
          else if (h >= 23 || h <= 2) finalCategory = Category.Lunch;
          else if (h >= 6 && h <= 8) finalCategory = Category.Dinner;
          else finalCategory = Category.Other;
      } else {
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
      const week = prev.weeks[viewingWeekKey];
      if (!week) return prev;
      return {
        ...prev,
        weeks: {
          ...prev.weeks,
          [viewingWeekKey]: {
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

  const currentWeekData = data.weeks[viewingWeekKey] || {
    weekStartDate: viewingWeekKey,
    dailySubsidy: data.currentDailySubsidySetting,
    budget: data.currentDailySubsidySetting * 6,
    hourlyRate: data.currentHourlyRateSetting || 0,
    shiftMode: data.currentShiftSetting || 'day',
    dailyHours: {},
    workDays: {},
    expenses: []
  };

  const handleTabChange = (newView: View) => {
      setView(newView);
      if (newView === View.Dashboard) {
          setViewingDate(new Date());
      }
  };

  return (
    <div className="min-h-screen flex justify-center md:py-8">
      <div className="w-full md:max-w-md bg-white/80 md:rounded-[40px] h-[100dvh] md:h-[90vh] shadow-2xl relative flex flex-col overflow-hidden glass border border-white/20">
        
        {/* Header */}
        <header className="pt-8 pb-4 px-6 sticky top-0 z-10 bg-white/50 backdrop-blur-md border-b border-gray-100/50 shrink-0">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center text-white">
                        <Sparkles size={16} fill="white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-extrabold text-gray-900 tracking-tight leading-none">WeeklyKeeper</h1>
                        <p className="text-[10px] text-gray-500 font-medium tracking-wider uppercase mt-0.5">Self-Hosted</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${serverConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        <Server size={10} />
                        {serverConnected ? '已连接' : '离线'}
                    </div>
                    <label className="p-2 text-gray-400 hover:text-black cursor-pointer transition-colors bg-gray-50 hover:bg-gray-100 rounded-full">
                        <Upload size={18} />
                        <input type="file" className="hidden" accept=".json" onChange={handleFileImport} />
                    </label>
                </div>
            </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-5 no-scrollbar pb-32">
            {view === View.Dashboard ? (
                <Dashboard 
                    viewingDate={viewingDate}
                    onDateChange={setViewingDate}
                    weekData={currentWeekData} 
                    onAddExpense={handleAddExpense}
                    onDeleteExpense={(id) => handleDeleteExpense(viewingWeekKey, id)}
                    onUpdateWorkHours={handleUpdateWorkHours}
                    onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
                    onToggleWorkDay={handleToggleWorkDay}
                />
            ) : (
                <History 
                    data={data}
                    onDeleteExpense={handleDeleteExpense}
                    onUpdateHistoryHours={handleUpdateHistoryHours}
                />
            )}
        </main>

        <div className="absolute bottom-8 left-0 right-0 flex justify-center z-50 pointer-events-none">
            <nav className="bg-black/90 backdrop-blur-xl text-white rounded-full px-2 py-1.5 shadow-2xl pointer-events-auto flex gap-1 border border-white/10 scale-95">
                <button 
                    onClick={() => handleTabChange(View.Dashboard)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-300 ${view === View.Dashboard ? 'bg-white/20 font-bold' : 'text-gray-400 hover:text-white'}`}
                >
                    <LayoutDashboard size={20} strokeWidth={view === View.Dashboard ? 2.5 : 2} />
                    <span className={`text-xs ${view === View.Dashboard ? 'block' : 'hidden'}`}>记账</span>
                </button>
                <button 
                    onClick={() => handleTabChange(View.History)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-300 ${view === View.History ? 'bg-white/20 font-bold' : 'text-gray-400 hover:text-white'}`}
                >
                    <HistoryIcon size={20} strokeWidth={view === View.History ? 2.5 : 2} />
                    <span className={`text-xs ${view === View.History ? 'block' : 'hidden'}`}>历史</span>
                </button>
            </nav>
        </div>

        <BudgetModal 
            isOpen={isBudgetModalOpen} 
            onClose={() => setIsBudgetModalOpen(false)} 
            currentDailySubsidy={currentWeekData.dailySubsidy}
            currentHourlyRate={currentWeekData.hourlyRate || 0}
            currentShift={currentWeekData.shiftMode || 'day'}
            fullDataState={data}
            onSave={handleSetSettings}
            onRestoreData={handleRestoreData}
        />

      </div>
    </div>
  );
};

export default App;