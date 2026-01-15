import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Clock, PieChart, Trash2, ChevronRight, Info } from 'lucide-react';
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

  // --- New Logic: Weekly Cumulative Subsidy Calculation ---
  
  // 1. Calculate expenses BEFORE today within this week
  // Since dateStr is YYYY-MM-DD, strict string comparison works for chronological order
  const previousExpenses = weekData.expenses.filter(e => e.dateStr < dateStr);
  const previousSpend = previousExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 2. Budget Logic
  const weekBudget = weekData.budget;
  
  // 3. How much had we overflowed BEFORE today?
  const previousOverflow = Math.max(0, previousSpend - weekBudget);

  // 4. How much have we overflowed INCLUDING today?
  const cumulativeSpend = previousSpend + totalExpenseToday;
  const currentTotalOverflow = Math.max(0, cumulativeSpend - weekBudget);

  // 5. The actual deduction attributed to TODAY is the difference
  // Example: Budget 168.
  // Mon: Spend 100. PreOverflow=0. CurrOverflow=0. Deduction=0.
  // Tue: Spend 100. PreSpend=100. CumSpend=200. PreOverflow=0. CurrOverflow=32. Deduction=32.
  const realDeduction = currentTotalOverflow - previousOverflow;
  
  // 6. Net Balance
  const balance = wage - realDeduction;

  // For display: How much was covered by subsidy today?
  const coveredBySubsidy = totalExpenseToday - realDeduction;

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
  
  // Tailwind Colors Mapping
  const colorMap: Record<Category, string> = {
      [Category.Breakfast]: '#f97316', // orange-500
      [Category.Lunch]: '#ca8a04',     // yellow-600
      [Category.Dinner]: '#4f46e5',    // indigo-600
      [Category.Other]: '#4b5563'      // gray-600
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
                     <p className="text-xs text-gray-400 font-medium mb-1">今日净收 (扣除超支后)</p>
                     <p className={`text-2xl font-extrabold ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                         {balance >= 0 ? '+' : ''}{balance.toFixed(0)}
                     </p>
                 </div>
            </div>

            {/* Income vs Expense Progress */}
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between text-xs mb-1.5 px-1">
                        <span className="text-gray-500 font-medium">工时收入</span>
                        <span className="font-bold text-gray-900">¥{wage.toFixed(0)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full w-full opacity-80"></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-1.5 px-1">
                        <span className="text-gray-500 font-medium">今日支出</span>
                        <div className="text-right">
                             <span className="font-bold text-gray-900">¥{totalExpenseToday.toFixed(1)}</span>
                             {coveredBySubsidy > 0 && (
                                 <span className="text-[10px] text-green-600 ml-1">
                                     (餐补抵扣 {coveredBySubsidy.toFixed(1)})
                                 </span>
                             )}
                        </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden relative">
                        {/* Subsidy Part (Green) */}
                        <div 
                           className="absolute top-0 left-0 h-full bg-green-400 rounded-full transition-all duration-500" 
                           style={{ width: `${wage > 0 ? Math.min(100, (coveredBySubsidy / wage) * 100) : 0}%` }}
                        ></div>
                        {/* Deduction Part (Red) - starts after green */}
                        <div 
                           className="absolute top-0 h-full bg-red-500 rounded-r-full transition-all duration-500" 
                           style={{ 
                               left: `${wage > 0 ? Math.min(100, (coveredBySubsidy / wage) * 100) : 0}%`,
                               width: `${wage > 0 ? Math.min(100, (realDeduction / wage) * 100) : (realDeduction > 0 ? 100 : 0)}%` 
                           }}
                        ></div>
                    </div>
                    {realDeduction > 0 ? (
                        <p className="text-[10px] text-red-500 mt-1 text-right font-medium">
                            今日导致超支，工资扣除 ¥{realDeduction.toFixed(1)}
                        </p>
                    ) : totalExpenseToday > 0 ? (
                        <p className="text-[10px] text-green-600 mt-1 text-right font-medium">
                            本周额度内，不扣工资
                        </p>
                    ) : null}
                </div>
            </div>
            
            {/* Logic Explanation Box */}
            <div className="mt-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="flex items-start gap-2">
                    <Info size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <div className="text-[10px] text-gray-500 space-y-1">
                        <div className="flex justify-between">
                            <span>本周累计(含今日):</span>
                            <span className="font-medium">¥{cumulativeSpend.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>本周餐补预算:</span>
                            <span className="font-medium">¥{weekBudget}</span>
                        </div>
                        {currentTotalOverflow > 0 && (
                            <div className="flex justify-between text-orange-600">
                                <span>当前累计超支:</span>
                                <span className="font-medium">¥{currentTotalOverflow.toFixed(1)}</span>
                            </div>
                        )}
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
                         
                         // Map config color class to hex for the dot
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