
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Clock, PieChart, Trash2, Info } from 'lucide-react';
import { AppState, Category } from '../types';
import { CATEGORY_CONFIG, WEEK_DAYS } from '../constants';
import ExpenseItem from './ExpenseItem';

interface Props {
  weekKey: string;
  dateStr: string;
  data: AppState;
  onBack: () => void;
  onUpdateHistoryHours: (weekKey: string, dateStr: string, hours: number) => void;
  onDeleteExpense: (weekKey: string, expenseId: string) => void;
}

const DailyDetail: React.FC<Props> = ({ weekKey, dateStr, data, onBack, onUpdateHistoryHours, onDeleteExpense }) => {
  const weekData = data.weeks[weekKey];
  if (!weekData) return null;

  const dateObj = new Date(dateStr);
  const dayName = WEEK_DAYS[dateObj.getDay()];
  
  // Expenses for THIS day
  const dayExpenses = useMemo(() => 
    weekData.expenses.filter(e => e.dateStr === dateStr).sort((a, b) => b.timestamp - a.timestamp),
    [weekData.expenses, dateStr]
  );
  
  const totalExpenseToday = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Work Hours
  const initialHours = weekData.dailyHours?.[dateStr] || 0;
  const [hours, setHours] = useState(initialHours.toString());
  
  useEffect(() => {
      setHours((weekData.dailyHours?.[dateStr] || 0).toString());
  }, [weekData.dailyHours, dateStr]);

  const handleHoursBlur = () => {
      const h = parseFloat(hours);
      if (!isNaN(h) && h >= 0) {
          onUpdateHistoryHours(weekKey, dateStr, h);
      }
  };

  const wage = (parseFloat(hours) || 0) * (weekData.hourlyRate || 0);

  // --- Dynamic Subsidy Logic ---
  const isWorkDay = weekData.workDays?.[dateStr] ?? false;
  const dailySubsidy = isWorkDay ? (weekData.dailySubsidy || 28) : 0;
  
  // Weekly context
  const activeWorkDaysCount = Object.values(weekData.workDays || {}).filter(Boolean).length;
  const weekTotalSubsidy = activeWorkDaysCount * (weekData.dailySubsidy || 0);
  const weekTotalSpent = weekData.expenses.reduce((s, e) => s + e.amount, 0);
  const weekBalance = weekTotalSubsidy - weekTotalSpent;

  // Day Impact
  const dayNet = dailySubsidy - totalExpenseToday;

  // Chart Data
  const categoryTotals = useMemo(() => {
      const totals: Record<string, number> = {};
      dayExpenses.forEach(e => {
          totals[e.category] = (totals[e.category] || 0) + e.amount;
      });
      return totals;
  }, [dayExpenses]);

  // Generate Conic Gradient for Pie Chart
  const categories = [Category.Breakfast, Category.Lunch, Category.Dinner, Category.Other];
  let currentAngle = 0;
  const gradientParts: string[] = [];
  
  const colorMap: Record<Category, string> = {
      [Category.Breakfast]: '#f97316', 
      [Category.Lunch]: '#ca8a04',     
      [Category.Dinner]: '#4f46e5',    
      [Category.Other]: '#4b5563'      
  };

  categories.forEach(cat => {
      const amount = categoryTotals[cat] || 0;
      if (amount > 0) {
          const percent = (amount / totalExpenseToday) * 100;
          gradientParts.push(`${colorMap[cat]} ${currentAngle}% ${currentAngle + percent}%`);
          currentAngle += percent;
      }
  });

  const pieStyle = {
      background: totalExpenseToday > 0 
        ? `conic-gradient(${gradientParts.join(', ')})` 
        : '#f3f4f6'
  };

  return (
    <div className="animate-in slide-in-from-right duration-300 bg-gray-50 min-h-full pb-20 absolute top-0 left-0 w-full h-full z-20 overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-200 p-4 flex items-center gap-4 z-30">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <div>
            <h2 className="text-lg font-bold text-gray-900">{dateObj.getMonth() + 1}月{dateObj.getDate()}日 {dayName}</h2>
            <p className="text-xs text-gray-500">详细收支表</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* 1. Summary Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-6">
                 <div className="flex items-start gap-3">
                     <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 mt-1">
                         <Clock size={20} />
                     </div>
                     <div>
                         <p className="text-xs text-gray-400 font-medium mb-1">今日工时</p>
                         <div className="flex items-baseline gap-1">
                             <input 
                               type="number" 
                               value={hours}
                               onChange={e => setHours(e.target.value)}
                               onBlur={handleHoursBlur}
                               className="w-16 text-3xl font-extrabold text-gray-900 border-b-2 border-transparent hover:border-gray-200 focus:border-blue-500 outline-none bg-transparent transition-colors p-0 m-0"
                             />
                             <span className="text-sm font-bold text-gray-400">h</span>
                         </div>
                     </div>
                 </div>
                 <div className="text-right">
                     <p className="text-xs text-gray-400 font-medium mb-1">工时收入</p>
                     <p className="text-2xl font-extrabold text-gray-800">
                         ¥{wage.toFixed(0)}
                     </p>
                 </div>
            </div>

            {/* Income vs Expense Progress */}
            <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex justify-between text-xs mb-2">
                        <span className="text-gray-500 font-bold">今日收支概况</span>
                        <span className={`font-bold ${dayNet >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {dayNet >= 0 ? '盈余' : '超支'} ¥{Math.abs(dayNet).toFixed(1)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                         <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-green-500"></div>
                             <span className="text-gray-600">获得餐补: {dailySubsidy}</span>
                         </div>
                         <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-red-500"></div>
                             <span className="text-gray-600">实际支出: {totalExpenseToday.toFixed(1)}</span>
                         </div>
                    </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                     <div className="flex items-start gap-2">
                         <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
                         <div>
                             <p className="text-xs font-bold text-blue-700 mb-1">对本周结算的影响</p>
                             <p className="text-[10px] text-blue-600 leading-relaxed">
                                 本日的{dayNet >= 0 ? '盈余' : '超支'} (¥{Math.abs(dayNet)}) 将计入本周总资金池。
                                 <br/>
                                 <span className="font-bold opacity-80">当前本周总结余: {weekBalance >= 0 ? '+' : ''}{weekBalance.toFixed(1)}</span>
                                 <br/>
                                 (总结余为负时才会在下月工资中扣除)
                             </p>
                         </div>
                     </div>
                </div>
            </div>
        </div>

        {/* 2. Expense Chart */}
        {totalExpenseToday > 0 && (
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6">
                 <div className="relative w-28 h-28 rounded-full shrink-0 shadow-inner" style={pieStyle}>
                     <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                         <div className="text-center">
                             <p className="text-[10px] text-gray-400 font-medium uppercase">Total</p>
                             <p className="text-sm font-extrabold text-gray-800">¥{totalExpenseToday.toFixed(0)}</p>
                         </div>
                     </div>
                 </div>
                 <div className="flex-1 space-y-2.5">
                     {categories.map(cat => {
                         const amt = categoryTotals[cat] || 0;
                         if (amt === 0) return null;
                         const config = CATEGORY_CONFIG[cat];
                         const percent = ((amt / totalExpenseToday) * 100).toFixed(0);
                         const dotColorClass = config.bg.replace('bg-', 'bg-').replace('100', '500');
                         
                         return (
                             <div key={cat} className="flex items-center justify-between text-xs">
                                 <div className="flex items-center gap-2">
                                     <div className={`w-2.5 h-2.5 rounded-full ${dotColorClass}`}></div>
                                     <span className="text-gray-600 font-medium">{cat}</span>
                                 </div>
                                 <div className="flex items-center gap-3">
                                     <span className="font-bold text-gray-900">¥{amt.toFixed(1)}</span>
                                     <span className="text-gray-400 font-mono text-[10px] w-6 text-right">{percent}%</span>
                                 </div>
                             </div>
                         )
                     })}
                 </div>
            </div>
        )}

        {/* 3. Transaction List */}
        <div>
            <h3 className="font-bold text-gray-900 text-sm mb-4 ml-1 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-gray-400" />
                消费明细
            </h3>
            {dayExpenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                         <Trash2 className="text-gray-300 w-5 h-5" />
                    </div>
                    <p className="text-gray-400 text-sm">今日无支出记录</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {dayExpenses.map(e => (
                        <ExpenseItem key={e.id} expense={e} onDelete={() => onDeleteExpense(weekKey, e.id)} />
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DailyDetail;
