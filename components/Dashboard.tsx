import React, { useState, useMemo, useEffect } from 'react';
import { Category, WeekData } from '../types';
import { CATEGORY_CONFIG, WEEK_DAYS } from '../constants';
import { formatTime, isSunday, formatDateKey } from '../services/dateService';
import ExpenseItem from './ExpenseItem';
import { AlertTriangle, Plus, Settings, Briefcase, Wallet, Moon, Sun, Calendar, ChevronDown } from 'lucide-react';

interface Props {
  viewingDate: Date;
  onDateChange: (date: Date) => void;
  weekData: WeekData;
  onAddExpense: (amount: number, category: Category | null, note: string, time: string) => void;
  onDeleteExpense: (id: string) => void;
  onUpdateWorkHours: (hours: number) => void;
  onOpenBudgetModal: () => void;
}

const Dashboard: React.FC<Props> = ({ viewingDate, onDateChange, weekData, onAddExpense, onDeleteExpense, onUpdateWorkHours, onOpenBudgetModal }) => {
  const viewingDateStr = formatDateKey(viewingDate);
  const isViewingDateSunday = isSunday(viewingDate);

  // Date Display Logic
  const year = viewingDate.getFullYear();
  const month = viewingDate.getMonth() + 1;
  const day = viewingDate.getDate();
  const weekDay = WEEK_DAYS[viewingDate.getDay()];

  // Form State for Expense
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [time, setTime] = useState(formatTime(new Date()));

  // Form State for Work Hours
  const [todayHours, setTodayHours] = useState<string>('');

  useEffect(() => {
     const savedHours = weekData.dailyHours?.[viewingDateStr];
     if (savedHours !== undefined) {
         setTodayHours(savedHours.toString());
     } else {
         setTodayHours('');
     }
  }, [weekData.dailyHours, viewingDateStr]);

  // --- Calculations ---
  const currentHourlyRate = weekData.hourlyRate || 0;
  const hoursToday = parseFloat(todayHours) || 0;
  const wageToday = hoursToday * currentHourlyRate;
  
  const totalWeekHours = Object.values(weekData.dailyHours || {}).reduce((sum, h) => sum + h, 0);
  const wageWeekTotal = totalWeekHours * currentHourlyRate;

  // Expenses
  const todayExpensesList = useMemo(() => 
    weekData.expenses.filter(e => e.dateStr === viewingDateStr).sort((a, b) => b.timestamp - a.timestamp),
  [weekData.expenses, viewingDateStr]);

  const todaySpent = todayExpensesList.reduce((sum, e) => sum + e.amount, 0);
  const weekSpent = weekData.expenses.reduce((sum, e) => sum + e.amount, 0);

  const weekBudget = weekData.budget;
  const weekExcess = Math.max(0, weekSpent - weekBudget);
  const weekNetIncome = wageWeekTotal - weekExcess;

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

  return (
    <div className="pb-24 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 0. Calendar Header (Interactive) */}
      <div className="flex items-center justify-between px-1 pt-2">
          <div className="relative group cursor-pointer p-1 -m-1 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="flex items-baseline gap-2">
                  <h1 className="text-3xl font-extrabold text-gray-900">{day}日</h1>
                  <span className="text-sm font-bold text-gray-500 flex items-center gap-1">
                      {weekDay}
                      <ChevronDown size={14} className="opacity-50" />
                  </span>
              </div>
              <p className="text-xs font-medium text-gray-400">{year}年{month}月</p>
              
              {/* Invisible Native Date Picker Layer */}
              <input 
                  type="date" 
                  value={viewingDateStr}
                  onChange={handleDateInputChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
          </div>
          
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 shadow-sm ${isViewingDateSunday ? 'bg-yellow-50 border-yellow-100 text-yellow-700' : 'bg-white border-gray-100 text-gray-600'}`}>
              <Calendar size={16} className={isViewingDateSunday ? "text-yellow-600" : "text-gray-400"} />
              <div className="text-right">
                  <p className="text-[10px] font-bold leading-tight">{isViewingDateSunday ? '周日结算' : '正常工作'}</p>
                  <p className="text-[8px] opacity-80 leading-tight">
                      {isViewingDateSunday ? 'Settlement' : 'Work Day'}
                  </p>
              </div>
          </div>
      </div>

      {/* 1. Overview Card (Income & Net) */}
      <div className={`rounded-3xl p-6 shadow-lg text-white relative overflow-hidden transition-colors duration-500 ${weekData.shiftMode === 'night' ? 'bg-gradient-to-br from-indigo-950 to-slate-900' : 'bg-gradient-to-br from-gray-900 to-gray-800'}`}>
        
        {/* Theme Decoration */}
        {weekData.shiftMode === 'night' ? (
           <>
             <div className="absolute top-4 right-4 text-white/10"><Moon size={120} /></div>
             <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 bg-indigo-500/20 rounded-full blur-xl"></div>
           </>
        ) : (
           <>
             <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
             <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 bg-orange-500/10 rounded-full blur-xl"></div>
           </>
        )}

        <div className="flex justify-between items-start mb-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
                <h2 className="text-gray-400 text-xs font-medium uppercase tracking-wider">本周净收入 (截至目前)</h2>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${weekData.shiftMode === 'night' ? 'border-indigo-400 text-indigo-300' : 'border-orange-400 text-orange-300'}`}>
                    {weekData.shiftMode === 'night' ? '晚班' : '白班'}
                </span>
            </div>
            <div className="text-4xl font-extrabold tracking-tight">
              ¥{weekNetIncome.toFixed(0)}
            </div>
            {weekExcess > 0 && (
                <div className="text-red-400 text-xs mt-1 font-medium bg-red-900/30 px-2 py-1 rounded-md inline-block">
                    本周总超支 ¥{weekExcess.toFixed(1)} (已扣除)
                </div>
            )}
          </div>
          <button 
            onClick={onOpenBudgetModal}
            className="p-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            <Settings size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 relative z-10">
            {/* Today's Stats */}
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/5">
                <div className={`flex items-center gap-1.5 mb-2 ${weekData.shiftMode === 'night' ? 'text-indigo-200' : 'text-blue-200'}`}>
                    <Briefcase size={14} />
                    <span className="text-xs font-bold">当日工作</span>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold">{hoursToday}</span>
                    <span className="text-xs text-gray-400">小时</span>
                </div>
                <div className="mt-1 flex justify-between items-end">
                     <span className="text-xs text-gray-400">赚取</span>
                     <span className="text-sm font-bold text-green-300">¥{wageToday.toFixed(0)}</span>
                </div>
            </div>

            {/* Week's Wages (Gross) */}
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/5">
                <div className="flex items-center gap-1.5 mb-2 text-purple-200">
                    <Wallet size={14} />
                    <span className="text-xs font-bold">本周总工时</span>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold">{totalWeekHours}</span>
                    <span className="text-xs text-gray-400">小时</span>
                </div>
                <div className="mt-1 flex justify-between items-end">
                     <span className="text-xs text-gray-400">应发</span>
                     <span className="text-sm font-bold text-purple-300">¥{wageWeekTotal.toFixed(0)}</span>
                </div>
            </div>
        </div>
      </div>

      {/* 2. Work Log Section */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
           <div className="flex items-center gap-3">
               <div className={`p-2.5 rounded-full ${weekData.shiftMode === 'night' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                   {weekData.shiftMode === 'night' ? <Moon size={20} /> : <Sun size={20} />}
               </div>
               <div>
                   <h3 className="font-bold text-gray-800 text-sm">{viewingDateStr === formatDateKey(new Date()) ? '今日' : '补录'}工时登记</h3>
                   <p className="text-xs text-gray-400">时薪 ¥{currentHourlyRate}</p>
               </div>
           </div>
           <div className="flex items-center gap-2">
               <input 
                  type="number" 
                  step="0.5"
                  value={todayHours}
                  onChange={(e) => setTodayHours(e.target.value)}
                  onBlur={handleHoursBlur}
                  placeholder="0"
                  className="w-20 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-center text-lg font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
               />
               <span className="text-sm font-medium text-gray-500">小时</span>
           </div>
      </div>

      {/* 3. Expense/Subsidy Status (Weekly Aggregate) */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 text-sm">本周餐补进度</h3>
              <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg font-bold">
                  总预算 ¥{weekBudget}
              </span>
          </div>
          
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div 
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${weekSpent > weekBudget ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(100, (weekSpent / weekBudget) * 100)}%` }}
              ></div>
          </div>
          
          <div className="flex justify-between text-xs mt-2">
              <span className="text-gray-500">已用 ¥{weekSpent.toFixed(1)}</span>
              {weekSpent > weekBudget ? (
                  <span className="text-red-600 font-bold">已超支 ¥{(weekSpent - weekBudget).toFixed(1)} (从工资扣除)</span>
              ) : (
                  <span className="text-green-600 font-bold">剩余 ¥{(weekBudget - weekSpent).toFixed(1)}</span>
              )}
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center">
              * 当日超支不会立即扣款，仅当本周累计消费超过 ¥{weekBudget} 时扣除。
          </p>
      </div>

      {/* 4. Add Expense Form */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-500" />
            {viewingDateStr === formatDateKey(new Date()) ? '记一笔支出' : `补录 ${month}月${day}日 支出`}
        </h3>
        
        {isViewingDateSunday ? (
            <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-bold">周日结算日</p>
                    <p className="text-xs mt-1 opacity-80">日常餐补仅限周一至周六。消费将全额计入额外支出。</p>
                </div>
            </div>
        ) : weekData.hourlyRate <= 0 ? (
           <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex items-center gap-3 cursor-pointer" onClick={onOpenBudgetModal}>
                <Settings className="w-5 h-5" />
                <p className="text-sm">请先设置工价和餐补预算。</p>
            </div>
        ) : (
          <form onSubmit={handleExpenseSubmit} className="space-y-4">
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">金额</label>
                    <input 
                        type="number" 
                        step="0.01"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-lg font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="w-1/3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">时间</label>
                    <input 
                        type="time" 
                        value={time}
                        onChange={e => setTime(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-2.5 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div>
                 <label className="block text-xs font-medium text-gray-500 mb-2">分类</label>
                 <div className="flex gap-2 justify-between">
                    {Object.values(Category).map(cat => {
                        const config = CATEGORY_CONFIG[cat];
                        const Icon = config.icon;
                        const isSelected = category === cat;
                        return (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setCategory(isSelected ? null : cat)}
                                className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${isSelected ? `border-${config.color.split('-')[1]}-500 ${config.bg}` : 'border-gray-100 bg-white hover:bg-gray-50'}`}
                            >
                                <Icon className={`w-5 h-5 mb-1 ${isSelected ? config.color : 'text-gray-400'}`} />
                                <span className={`text-[10px] ${isSelected ? 'font-bold text-gray-800' : 'text-gray-500'}`}>{cat}</span>
                            </button>
                        )
                    })}
                 </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">备注</label>
                <input 
                    type="text" 
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="例如：买烟、饮料..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <button type="submit" className="w-full bg-black text-white py-3 rounded-xl font-bold shadow-lg shadow-gray-200 active:scale-95 transition-transform">
                记录并计算
            </button>
          </form>
        )}
      </div>

      {/* 5. Today's List */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
         <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider text-gray-400">
             {viewingDateStr === formatDateKey(new Date()) ? '今日' : `${day}日`}消费明细
         </h3>
         {todayExpensesList.length === 0 ? (
             <div className="text-center py-8 text-gray-400 text-sm">
                 暂无消费
             </div>
         ) : (
             <div>
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