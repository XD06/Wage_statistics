import React, { useState, useMemo } from 'react';
import { AppState } from '../types';
import { getWeekRangeDisplay } from '../services/dateService';
import { WEEK_DAYS } from '../constants';
import ExpenseItem from './ExpenseItem';
import { ChevronDown, ChevronRight, Download, Calendar } from 'lucide-react';
import { exportData } from '../services/storageService';

interface Props {
  data: AppState;
  onDeleteExpense: (weekKey: string, expenseId: string) => void;
}

const History: React.FC<Props> = ({ data, onDeleteExpense }) => {
  // 1. Group Weeks by Month
  const weeksByMonth = useMemo(() => {
      const groups: Record<string, string[]> = {};
      Object.keys(data.weeks).sort((a, b) => b.localeCompare(a)).forEach(weekKey => {
          // weekKey is YYYY-MM-DD. Extract YYYY-MM
          const monthKey = weekKey.substring(0, 7);
          if (!groups[monthKey]) groups[monthKey] = [];
          groups[monthKey].push(weekKey);
      });
      return groups;
  }, [data.weeks]);

  const sortedMonths = Object.keys(weeksByMonth).sort((a, b) => b.localeCompare(a));

  // State
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>(() => {
      // Default expand the first month
      const first = sortedMonths[0];
      return first ? { [first]: true } : {};
  });
  
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});

  const toggleMonth = (m: string) => setExpandedMonths(prev => ({ ...prev, [m]: !prev[m] }));
  const toggleWeek = (w: string) => setExpandedWeeks(prev => ({ ...prev, [w]: !prev[w] }));

  return (
    <div className="pb-24 space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
       <div className="flex justify-between items-center px-2">
            <h2 className="text-2xl font-bold text-gray-800">历史账单</h2>
            <button 
                onClick={() => exportData(data)}
                className="flex items-center gap-1 text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
            >
                <Download size={14} />
                导出
            </button>
       </div>

       {sortedMonths.length === 0 && (
           <div className="text-center py-12 text-gray-400">暂无记录</div>
       )}

       {sortedMonths.map(monthKey => {
           const [year, month] = monthKey.split('-');
           const weekKeys = weeksByMonth[monthKey];
           const isMonthExpanded = expandedMonths[monthKey];

           // Calculate Month Totals for preview
           let monthWage = 0;
           let monthNet = 0;
           weekKeys.forEach(wk => {
               const wd = data.weeks[wk];
               const totalHours = Object.values(wd.dailyHours || {}).reduce((s, h) => s + h, 0);
               const wage = totalHours * (wd.hourlyRate || 0);
               
               // Calculate Daily Excess strictly
               const expensesByDate: Record<string, number> = {};
               wd.expenses.forEach(e => {
                   expensesByDate[e.dateStr] = (expensesByDate[e.dateStr] || 0) + e.amount;
               });
               let weekExcess = 0;
               const dailySubsidy = wd.budget / 6;
               Object.entries(expensesByDate).forEach(([dateStr, spent]) => {
                  const dateObj = new Date(dateStr);
                  const limit = dateObj.getDay() === 0 ? 0 : dailySubsidy;
                  weekExcess += Math.max(0, spent - limit);
               });

               monthWage += wage;
               monthNet += (wage - weekExcess);
           });

           return (
               <div key={monthKey} className="space-y-3">
                   {/* Month Header */}
                   <button 
                     onClick={() => toggleMonth(monthKey)}
                     className="w-full flex items-center justify-between bg-gray-900 text-white p-4 rounded-2xl shadow-md"
                   >
                       <div className="flex items-center gap-3">
                           <div className="bg-white/10 p-2 rounded-xl">
                               <Calendar size={20} />
                           </div>
                           <div className="text-left">
                               <h3 className="text-lg font-bold">{year}年{month}月</h3>
                               <p className="text-xs text-gray-400">包含 {weekKeys.length} 个记录周</p>
                           </div>
                       </div>
                       <div className="text-right">
                           <p className="text-sm font-medium text-gray-300">月净入</p>
                           <p className="text-xl font-bold text-green-400">¥{monthNet.toFixed(0)}</p>
                       </div>
                   </button>

                   {/* Weeks List */}
                   {isMonthExpanded && (
                       <div className="space-y-4 pl-2">
                           {weekKeys.map(weekKey => {
                               const weekData = data.weeks[weekKey];
                               const rangeStr = getWeekRangeDisplay(weekKey);
                               const isWeekExpanded = expandedWeeks[weekKey];
                               
                               // Week Calcs
                               const totalHours = Object.values(weekData.dailyHours || {}).reduce((s, h) => s + h, 0);
                               const wage = totalHours * (weekData.hourlyRate || 0);
                               
                               // Calculate Daily Excess strictly for the specific week
                               const expensesByDate: Record<string, number> = {};
                               const groupedExpensesList: Record<string, typeof weekData.expenses> = {};
                               
                               weekData.expenses.forEach(e => {
                                   expensesByDate[e.dateStr] = (expensesByDate[e.dateStr] || 0) + e.amount;
                                   if (!groupedExpensesList[e.dateStr]) groupedExpensesList[e.dateStr] = [];
                                   groupedExpensesList[e.dateStr].push(e);
                               });
                               
                               let weekExcess = 0;
                               const dailySubsidy = weekData.budget / 6;
                               Object.entries(expensesByDate).forEach(([dateStr, spent]) => {
                                  const dateObj = new Date(dateStr);
                                  const limit = dateObj.getDay() === 0 ? 0 : dailySubsidy;
                                  weekExcess += Math.max(0, spent - limit);
                               });

                               const netIncome = wage - weekExcess;
                               const sortedDates = Object.keys(groupedExpensesList).sort((a, b) => b.localeCompare(a));

                               return (
                                   <div key={weekKey} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                       <button 
                                          onClick={() => toggleWeek(weekKey)}
                                          className="w-full p-4 hover:bg-gray-50 transition-colors"
                                       >
                                           <div className="flex justify-between items-start mb-2">
                                               <span className="font-bold text-gray-800 text-sm">{rangeStr}</span>
                                               {isWeekExpanded ? <ChevronDown size={16} className="text-gray-400"/> : <ChevronRight size={16} className="text-gray-400"/>}
                                           </div>
                                           <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                                                <div className="text-center">
                                                    <p className="text-[10px] text-gray-500 mb-0.5">工时</p>
                                                    <p className="font-bold text-gray-800">{totalHours}h</p>
                                                </div>
                                                <div className="w-px h-6 bg-gray-200"></div>
                                                <div className="text-center">
                                                    <p className="text-[10px] text-gray-500 mb-0.5">应发</p>
                                                    <p className="font-bold text-gray-800">¥{wage.toFixed(0)}</p>
                                                </div>
                                                <div className="w-px h-6 bg-gray-200"></div>
                                                <div className="text-center">
                                                    <p className="text-[10px] text-gray-500 mb-0.5">实收</p>
                                                    <p className={`font-bold ${weekExcess > 0 ? 'text-orange-600' : 'text-green-600'}`}>¥{netIncome.toFixed(0)}</p>
                                                </div>
                                           </div>
                                           {weekExcess > 0 && (
                                               <p className="text-xs text-red-400 mt-2 text-right">已扣除餐费超支 ¥{weekExcess.toFixed(1)}</p>
                                           )}
                                       </button>

                                       {isWeekExpanded && (
                                           <div className="border-t border-gray-100 p-4 bg-white">
                                               {sortedDates.length === 0 ? (
                                                   <p className="text-center text-sm text-gray-400">本周无消费记录</p>
                                               ) : sortedDates.map(dateStr => {
                                                   const dayExpenses = groupedExpensesList[dateStr];
                                                   const dayTotal = dayExpenses.reduce((s, e) => s + e.amount, 0);
                                                   const dateObj = new Date(dateStr);
                                                   const dayLabel = WEEK_DAYS[dateObj.getDay()];
                                                   const hoursWorked = weekData.dailyHours?.[dateStr] || 0;

                                                   return (
                                                       <div key={dateStr} className="mb-4 last:mb-0">
                                                           <div className="flex justify-between items-center mb-2 bg-blue-50/50 p-2 rounded-lg">
                                                               <div className="flex items-center gap-2">
                                                                   <span className="font-bold text-gray-700 text-sm">{dateObj.getMonth()+1}.{dateObj.getDate()} {dayLabel}</span>
                                                                   {hoursWorked > 0 && (
                                                                       <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">工 {hoursWorked}h</span>
                                                                   )}
                                                               </div>
                                                               <span className="text-xs font-bold text-gray-500">消费 ¥{dayTotal.toFixed(1)}</span>
                                                           </div>
                                                           {dayExpenses.map(e => (
                                                               <ExpenseItem key={e.id} expense={e} onDelete={() => onDeleteExpense(weekKey, e.id)} />
                                                           ))}
                                                       </div>
                                                   );
                                               })}
                                           </div>
                                       )}
                                   </div>
                               );
                           })}
                       </div>
                   )}
               </div>
           );
       })}
    </div>
  );
};

export default History;