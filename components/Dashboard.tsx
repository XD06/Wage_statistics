import React, { useState, useMemo, useEffect } from 'react';
import { Category, WeekData } from '../types';
import { CATEGORY_CONFIG, WEEK_DAYS } from '../constants';
import { formatTime, isSunday, formatDateKey, getMonday } from '../services/dateService';
import ExpenseItem from './ExpenseItem';
import { Plus, Settings, Briefcase, Wallet, Moon, Sun, ChevronDown, Calculator, CalendarDays } from 'lucide-react';

interface Props {
  viewingDate: Date;
  onDateChange: (date: Date) => void;
  weekData: WeekData;
  onAddExpense: (amount: number, category: Category | null, note: string, time: string) => void;
  onDeleteExpense: (id: string) => void;
  onUpdateWorkHours: (hours: number) => void;
  onOpenBudgetModal: () => void;
  onToggleWorkDay: (dateStr: string, isWork: boolean) => void;
}

const Dashboard: React.FC<Props> = ({ viewingDate, onDateChange, weekData, onAddExpense, onDeleteExpense, onUpdateWorkHours, onOpenBudgetModal, onToggleWorkDay }) => {
  const viewingDateStr = formatDateKey(viewingDate);
  const isViewingDateSunday = isSunday(viewingDate);
  const mondayDate = getMonday(viewingDate);

  // Date Display Logic
  const year = viewingDate.getFullYear();
  const month = viewingDate.getMonth() + 1;
  const day = viewingDate.getDate();
  const weekDay = WEEK_DAYS[viewingDate.getDay()];

  // Form State
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [time, setTime] = useState(formatTime(new Date()));

  // Work Hours
  const [todayHours, setTodayHours] = useState<string>('');

  useEffect(() => {
     const savedHours = weekData.dailyHours?.[viewingDateStr];
     if (savedHours !== undefined) {
         setTodayHours(savedHours.toString());
     } else {
         setTodayHours('');
     }
  }, [weekData.dailyHours, viewingDateStr]);

  const isWorkDay = weekData.workDays?.[viewingDateStr] ?? false;

  // --- Calculations ---
  const currentHourlyRate = weekData.hourlyRate || 0;
  const hoursToday = parseFloat(todayHours) || 0;
  
  const totalWeekHours = Object.values(weekData.dailyHours || {}).reduce((sum, h) => sum + h, 0);
  const wageWeekTotal = totalWeekHours * currentHourlyRate;

  // Expenses
  const todayExpensesList = useMemo(() => 
    weekData.expenses.filter(e => e.dateStr === viewingDateStr).sort((a, b) => b.timestamp - a.timestamp),
  [weekData.expenses, viewingDateStr]);

  const todaySpent = todayExpensesList.reduce((sum, e) => sum + e.amount, 0);
  const weekSpent = weekData.expenses.reduce((sum, e) => sum + e.amount, 0);

  const activeWorkDaysCount = Object.values(weekData.workDays || {}).filter(Boolean).length;
  const dailySubsidy = weekData.dailySubsidy || 0;
  const weekBudget = activeWorkDaysCount * dailySubsidy;

  const weekExcess = Math.max(0, weekSpent - weekBudget);
  const weekNetIncome = wageWeekTotal - weekExcess;

  const weekDates = useMemo(() => {
      const dates = [];
      for(let i=0; i<7; i++) {
          const d = new Date(mondayDate);
          d.setDate(mondayDate.getDate() + i);
          dates.push(d);
      }
      return dates;
  }, [mondayDate]);

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      alert("请输入有效的金额");
      return;
    }
    onAddExpense(num, category, note, time);
    setAmount('');
    setNote('');
    setCategory(null);
    setTime(formatTime(new Date()));
  };

  const handleHoursBlur = () => {
      const h = parseFloat(todayHours);
      if (!isNaN(h) && h >= 0) {
          onUpdateWorkHours(h);
      }
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newDate = new Date(e.target.value);
      if (!isNaN(newDate.getTime())) {
          onDateChange(newDate);
      }
  };

  // Theme Constants
  const isNightShift = weekData.shiftMode === 'night';
  const mainCardGradient = isNightShift 
    ? 'bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81]' 
    : 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900';
  
  const activeDayColor = isNightShift ? 'bg-indigo-600' : 'bg-black';

  return (
    <div className="pb-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 0. Top Controls */}
      <div className="flex items-center justify-between px-1">
          <div className="relative group cursor-pointer">
              <div className="flex items-baseline gap-2 transition-transform active:scale-95">
                  <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">{day}</h1>
                  <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-500 flex items-center gap-1 uppercase tracking-wide">
                          {weekDay} <ChevronDown size={14} />
                      </span>
                      <span className="text-xs text-gray-400 font-medium">{year}.{month}</span>
                  </div>
              </div>
              <input 
                  type="date" 
                  value={viewingDateStr}
                  onChange={handleDateInputChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
          </div>
          
          <button 
                onClick={onOpenBudgetModal}
                className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 text-gray-600 rounded-full hover:bg-gray-50 hover:shadow-md transition-all"
            >
                <Settings size={20} />
            </button>
      </div>

      {/* 1. Modern Week Schedule Strip */}
      <div className="bg-white rounded-[24px] p-2 shadow-sm border border-gray-100 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-50"></div>
          {weekDates.map((d, index) => {
              const dKey = formatDateKey(d);
              const isActive = weekData.workDays?.[dKey] ?? false; 
              const isSelected = dKey === viewingDateStr;
              const isToday = dKey === formatDateKey(new Date());
              const label = ['一','二','三','四','五','六','日'][index];

              return (
                  <button 
                    key={dKey}
                    onClick={() => onToggleWorkDay(dKey, !isActive)}
                    className={`relative z-10 flex flex-col items-center justify-center w-[13.5%] py-3 rounded-2xl transition-all duration-300 ${
                        isActive 
                            ? (isSelected ? `${activeDayColor} text-white shadow-lg scale-105` : 'bg-gray-100 text-gray-800 hover:bg-gray-200')
                            : 'text-gray-300 hover:text-gray-400'
                    }`}
                  >
                      <span className="text-[10px] font-bold mb-0.5 opacity-80">{label}</span>
                      <span className="text-sm font-extrabold">{d.getDate()}</span>
                      
                      {/* Status Dot */}
                      {isToday && !isActive && <div className="absolute bottom-1 w-1 h-1 bg-red-400 rounded-full"></div>}
                  </button>
              )
          })}
      </div>

      {/* 2. Main Financial Card */}
      <div className={`rounded-[32px] p-7 shadow-xl shadow-indigo-900/10 text-white relative overflow-hidden isolate ${mainCardGradient}`}>
        {/* Abstract Shapes */}
        <div className="absolute top-[-50%] right-[-20%] w-[80%] h-[80%] bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">本周净收入</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10 ${isNightShift ? 'bg-indigo-500/20 text-indigo-200' : 'bg-orange-500/20 text-orange-200'}`}>
                        {isNightShift ? 'NIGHT' : 'DAY'}
                    </span>
                </div>
                <div className="text-5xl font-extrabold tracking-tight flex items-baseline gap-1">
                    <span className="text-2xl opacity-60">¥</span>
                    {weekNetIncome.toFixed(0)}
                </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2 text-gray-300 mb-1">
                      <Briefcase size={14} />
                      <span className="text-xs font-bold">工时</span>
                  </div>
                  <div className="text-2xl font-bold">{totalWeekHours}<span className="text-sm text-gray-400 ml-1 font-medium">h</span></div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2 text-gray-300 mb-1">
                      <Wallet size={14} />
                      <span className="text-xs font-bold">薪资</span>
                  </div>
                  <div className="text-2xl font-bold">¥{wageWeekTotal.toFixed(0)}</div>
              </div>
          </div>
        </div>
      </div>

      {/* 3. Settlement Progress Bar Card */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="flex justify-between items-end mb-4 relative z-10">
              <div>
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-blue-500" />
                      本周收支概览
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">餐补盈余将结转用于抵扣</p>
              </div>
              <div className="text-right">
                  <span className={`text-xl font-extrabold ${weekBudget - weekSpent >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {weekBudget - weekSpent >= 0 ? '+' : ''}{(weekBudget - weekSpent).toFixed(1)}
                  </span>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">当前结余</p>
              </div>
          </div>

          {/* Visual Bar */}
          <div className="flex h-4 rounded-full overflow-hidden bg-gray-100 mb-4">
              <div className="bg-green-500 transition-all duration-700" style={{ width: `${Math.min(100, (weekBudget / (weekBudget + weekSpent || 1)) * 100)}%` }}></div>
              <div className="bg-red-500 transition-all duration-700" style={{ width: `${Math.min(100, (weekSpent / (weekBudget + weekSpent || 1)) * 100)}%` }}></div>
          </div>

          <div className="flex justify-between items-center text-xs font-medium">
               <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500"></div>
                   <span className="text-gray-600">额度 ¥{weekBudget} ({activeWorkDaysCount}天)</span>
               </div>
               <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-red-500"></div>
                   <span className="text-gray-600">支出 ¥{weekSpent.toFixed(0)}</span>
               </div>
          </div>
      </div>

      {/* 4. Add Expense & Log Work Section */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Header Strip */}
        <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Plus className="w-4 h-4 text-black" strokeWidth={3} />
                记账与工时
            </h3>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm">
                 <span className="text-[10px] font-bold text-gray-400 uppercase">Today's Work</span>
                 <input 
                    type="number" 
                    step="0.5"
                    value={todayHours}
                    onChange={(e) => setTodayHours(e.target.value)}
                    onBlur={handleHoursBlur}
                    placeholder="0"
                    className="w-8 text-center text-sm font-bold text-gray-900 outline-none bg-transparent p-0"
                 />
                 <span className="text-[10px] font-bold text-gray-400">H</span>
            </div>
        </div>
        
        <div className="p-6">
            {!isWorkDay && (
                <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl mb-6 text-center">
                    <p className="text-sm font-bold text-gray-500">今日标记为休息</p>
                    <p className="text-xs text-gray-400 mt-1">若需记工时或计算餐补，请在上方日历点击对应日期。</p>
                </div>
            )}

            {weekData.hourlyRate <= 0 ? (
               <button onClick={onOpenBudgetModal} className="w-full py-4 bg-gray-50 border border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold hover:bg-gray-100 transition-colors">
                    配置薪资参数以开始使用
                </button>
            ) : (
              <form onSubmit={handleExpenseSubmit} className="space-y-6">
                {/* Big Amount Input */}
                <div className="relative group">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block pl-1">Amount</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-300">¥</span>
                        <input 
                            type="number" 
                            step="0.01"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-gray-50 border-2 border-transparent hover:bg-white hover:border-gray-200 focus:bg-white focus:border-black rounded-2xl pl-10 pr-4 py-4 text-3xl font-extrabold text-gray-900 outline-none transition-all placeholder:text-gray-300"
                        />
                    </div>
                </div>

                {/* Category Grid */}
                <div>
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block pl-1">Category</label>
                     <div className="grid grid-cols-4 gap-3">
                        {Object.values(Category).map(cat => {
                            const config = CATEGORY_CONFIG[cat];
                            const Icon = config.icon;
                            const isSelected = category === cat;
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategory(isSelected ? null : cat)}
                                    className={`aspect-square flex flex-col items-center justify-center rounded-2xl border-2 transition-all duration-200 ${
                                        isSelected 
                                          ? `border-${config.color.split('-')[1]}-500 bg-${config.color.split('-')[1]}-50 scale-105 shadow-md` 
                                          : 'border-transparent bg-gray-50 hover:bg-gray-100 text-gray-400'
                                    }`}
                                >
                                    <Icon className={`w-6 h-6 mb-2 ${isSelected ? config.color : 'text-gray-400'}`} />
                                    <span className={`text-[10px] font-bold ${isSelected ? 'text-gray-900' : 'text-gray-400'}`}>{cat}</span>
                                </button>
                            )
                        })}
                     </div>
                </div>

                {/* Details Row */}
                <div className="flex gap-4">
                     <div className="flex-1">
                        <input 
                            type="text" 
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="添加备注..."
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-black transition-colors"
                        />
                     </div>
                     <div className="w-1/3">
                        <input 
                            type="time" 
                            value={time}
                            onChange={e => setTime(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl px-2 py-3 text-sm font-medium text-center text-gray-900 outline-none focus:border-black transition-colors"
                        />
                     </div>
                </div>

                <button type="submit" className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-gray-200 active:scale-95 transition-transform hover:bg-gray-900">
                    确认记账
                </button>
              </form>
            )}
        </div>
      </div>

      {/* 5. Today's List */}
      <div className="bg-white/60 backdrop-blur-md rounded-[32px] p-6 shadow-sm border border-white/50">
         <div className="flex items-center justify-between mb-4 px-1">
             <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                 <CalendarDays className="w-4 h-4 text-gray-400" />
                 今日明细
             </h3>
             <span className="text-xs font-bold text-gray-400">-{todaySpent.toFixed(1)}</span>
         </div>
         {todayExpensesList.length === 0 ? (
             <div className="text-center py-8 text-gray-300 text-sm font-medium">
                 今天还没有花钱 ✨
             </div>
         ) : (
             <div className="space-y-3">
                 {todayExpensesList.map(item => (
                     <ExpenseItem key={item.id} expense={item} onDelete={onDeleteExpense} />
                 ))}
             </div>
         )}
      </div>
    </div>
  );
};

export default Dashboard;