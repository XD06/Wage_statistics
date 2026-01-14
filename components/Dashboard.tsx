import React, { useState, useMemo, useEffect } from 'react';
import { Category, Expense, WeekData } from '../types';
import { CATEGORY_CONFIG } from '../constants';
import { formatTime, isSunday } from '../services/dateService';
import ExpenseItem from './ExpenseItem';
import { AlertTriangle, Plus, Settings, Briefcase, Wallet, Timer } from 'lucide-react';

interface Props {
  weekData: WeekData;
  onAddExpense: (amount: number, category: Category | null, note: string, time: string) => void;
  onDeleteExpense: (id: string) => void;
  onUpdateWorkHours: (hours: number) => void;
  onOpenBudgetModal: () => void;
}

const Dashboard: React.FC<Props> = ({ weekData, onAddExpense, onDeleteExpense, onUpdateWorkHours, onOpenBudgetModal }) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const isTodaySunday = isSunday(today);

  // Form State for Expense
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [time, setTime] = useState(formatTime(new Date()));

  // Form State for Work Hours
  const [todayHours, setTodayHours] = useState<string>('');

  useEffect(() => {
     // Initialize hours input from data
     const savedHours = weekData.dailyHours?.[todayStr];
     if (savedHours !== undefined) {
         setTodayHours(savedHours.toString());
     } else {
         setTodayHours('');
     }
  }, [weekData.dailyHours, todayStr]);

  // --- Calculations ---

  // 1. Time & Wages
  const currentHourlyRate = weekData.hourlyRate || 0;
  const hoursToday = parseFloat(todayHours) || 0;
  const wageToday = hoursToday * currentHourlyRate;
  
  const totalWeekHours = Object.values(weekData.dailyHours || {}).reduce((sum, h) => sum + h, 0);
  const wageWeekTotal = totalWeekHours * currentHourlyRate;

  // 2. Expenses & Subsidy
  const dailySubsidy = weekData.budget / 6;
  
  const todayExpensesList = useMemo(() => 
    weekData.expenses.filter(e => e.dateStr === todayStr).sort((a, b) => b.timestamp - a.timestamp),
  [weekData.expenses, todayStr]);

  const todaySpent = todayExpensesList.reduce((sum, e) => sum + e.amount, 0);
  
  // 3. Logic: Net Income (Strict Daily Deduction)
  // Instead of checking if Total Week Spend > Total Week Budget,
  // We check each day individually. If Day 1 is over budget, it penalizes the income immediately,
  // even if Day 2 is under budget.
  
  // Calculate Cumulative Daily Excess for the whole week
  const expensesByDate: Record<string, number> = {};
  weekData.expenses.forEach(e => {
      expensesByDate[e.dateStr] = (expensesByDate[e.dateStr] || 0) + e.amount;
  });

  let weekExcess = 0;
  Object.entries(expensesByDate).forEach(([dateStr, spent]) => {
      const dateObj = new Date(dateStr);
      // If it's Sunday (0), budget is 0 (all spend is excess), else dailySubsidy
      const limit = dateObj.getDay() === 0 ? 0 : dailySubsidy;
      weekExcess += Math.max(0, spent - limit);
  });

  const weekNetIncome = wageWeekTotal - weekExcess;

  // Today's Excess (for display)
  const todayExcess = Math.max(0, todaySpent - (isTodaySunday ? 0 : dailySubsidy));

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

  return (
    <div className="pb-24 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. Overview Card (Income & Net) */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 shadow-lg text-white relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 bg-blue-500/10 rounded-full blur-xl"></div>

        <div className="flex justify-between items-start mb-6 relative z-10">
          <div>
            <h2 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">本周实际净收入 (扣除超支)</h2>
            <div className="text-4xl font-extrabold tracking-tight">
              ¥{weekNetIncome.toFixed(0)}
            </div>
            {weekExcess > 0 && (
                <div className="text-red-400 text-xs mt-1 font-medium bg-red-900/30 px-2 py-1 rounded-md inline-block">
                    已扣除餐费超支 ¥{weekExcess.toFixed(1)}
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
                <div className="flex items-center gap-1.5 mb-2 text-blue-200">
                    <Briefcase size={14} />
                    <span className="text-xs font-bold">今日工作</span>
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
               <div className="bg-blue-50 p-2.5 rounded-full text-blue-600">
                   <Timer size={20} />
               </div>
               <div>
                   <h3 className="font-bold text-gray-800 text-sm">今日工时登记</h3>
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

      {/* 3. Expense/Subsidy Status */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 text-sm">今日餐补使用情况</h3>
              <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg font-bold">
                  日补 ¥{dailySubsidy.toFixed(0)}
              </span>
          </div>
          
          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div 
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${todaySpent > dailySubsidy ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(100, (todaySpent / dailySubsidy) * 100)}%` }}
              ></div>
          </div>
          
          <div className="flex justify-between text-xs">
              <span className="text-gray-500">已用 ¥{todaySpent.toFixed(1)}</span>
              {todaySpent > dailySubsidy ? (
                  <span className="text-red-600 font-bold">超支 ¥{(todaySpent - dailySubsidy).toFixed(1)} (扣工资)</span>
              ) : (
                  <span className="text-green-600 font-bold">剩余 ¥{(dailySubsidy - todaySpent).toFixed(1)}</span>
              )}
          </div>
      </div>

      {/* 4. Add Expense Form */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-500" />
            记一笔支出
        </h3>
        
        {isTodaySunday ? (
            <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-bold">今天是周日结算日</p>
                    <p className="text-xs mt-1 opacity-80">日常餐补仅限周一至周六。今日消费将全额计入额外支出。</p>
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
         <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider text-gray-400">今日消费明细</h3>
         {todayExpensesList.length === 0 ? (
             <div className="text-center py-8 text-gray-400 text-sm">
                 今日暂无消费
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