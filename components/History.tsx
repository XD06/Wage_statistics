import React, { useState, useMemo } from 'react';
import { AppState } from '../types';
import { getWeekRangeDisplay } from '../services/dateService';
import { WEEK_DAYS } from '../constants';
import DailyDetail from './DailyDetail';
import { ChevronDown, ChevronRight, Download, Calendar } from 'lucide-react';
import { exportData } from '../services/storageService';

interface Props {
  data: AppState;
  onDeleteExpense: (weekKey: string, expenseId: string) => void;
  onUpdateHistoryHours: (weekKey: string, dateStr: string, hours: number) => void;
}

const History: React.FC<Props> = ({ data, onDeleteExpense, onUpdateHistoryHours }) => {
  // 1. Group Weeks by Month
  const weeksByMonth = useMemo(() => {
      const groups: Record<string, string[]> = {};
      Object.keys(data.weeks).sort((a, b) => b.localeCompare(a)).forEach(weekKey => {
          const monthKey = weekKey.substring(0, 7);
          if (!groups[monthKey]) groups[monthKey] = [];
          groups[monthKey].push(weekKey);
      });
      return groups;
  }, [data.weeks]);

  const sortedMonths = Object.keys(weeksByMonth).sort((a, b) => b.localeCompare(a));

  // View Navigation State
  const [selectedDay, setSelectedDay] = useState<{weekKey: string, dateStr: string} | null>(null);

  // Expanded State
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>(() => {
      const first = sortedMonths[0];
      return first ? { [first]: true } : {};
  });
  
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});

  const toggleMonth = (m: string) => setExpandedMonths(prev => ({ ...prev, [m]: !prev[m] }));
  const toggleWeek = (w: string) => setExpandedWeeks(prev => ({ ...prev, [w]: !prev[w] }));

  // If a day is selected, show the detail view
  if (selectedDay) {
      return (
          <DailyDetail 
              weekKey={selectedDay.weekKey} 
              dateStr={selectedDay.dateStr} 
              data={data}
              onBack={() => setSelectedDay(null)}
              onUpdateHistoryHours={onUpdateHistoryHours}
              onDeleteExpense={onDeleteExpense}
          />
      );
  }

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

           // Calculate Month Totals
           let monthWage = 0;
           let monthNet = 0;
           weekKeys.forEach(wk => {
               const wd = data.weeks[wk];
               const totalHours = Object.values(wd.dailyHours || {}).reduce((s, h) => s + h, 0);
               const wage = totalHours * (wd.hourlyRate || 0);
               const totalSpent = wd.expenses.reduce((s, e) => s + e.amount, 0);
               const excess = Math.max(0, totalSpent - wd.budget);
               monthWage += wage;
               monthNet += (wage - excess);
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
                               
                               const totalHours = Object.values(weekData.dailyHours || {}).reduce((s, h) => s + h, 0);
                               const wage = totalHours * (weekData.hourlyRate || 0);
                               const totalSpent = weekData.expenses.reduce((s, e) => s + e.amount, 0);
                               const weekExcess = Math.max(0, totalSpent - weekData.budget);
                               const netIncome = wage - weekExcess;

                               // Collect all dates that have data
                               const datesWithData = new Set<string>();
                               weekData.expenses.forEach(e => datesWithData.add(e.dateStr));
                               Object.keys(weekData.dailyHours || {}).forEach(d => datesWithData.add(d));
                               const sortedDates = Array.from(datesWithData).sort((a, b) => b.localeCompare(a));

                               return (
                                   <div key={weekKey} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                       <button 
                                          onClick={() => toggleWeek(weekKey)}
                                          className="w-full p-4 hover:bg-gray-50 transition-colors"
                                       >
                                           <div className="flex justify-between items-start mb-2">
                                               <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                                   {rangeStr}
                                                   {weekData.shiftMode === 'night' && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 rounded">晚班</span>}
                                               </span>
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
                                       </button>

                                       {isWeekExpanded && (
                                           <div className="border-t border-gray-100 bg-white">
                                               {sortedDates.length === 0 ? (
                                                   <p className="text-center text-sm text-gray-400 py-4">本周无记录</p>
                                               ) : (
                                                   <div>
                                                       {sortedDates.map(dateStr => {
                                                           const dateObj = new Date(dateStr);
                                                           const dayLabel = WEEK_DAYS[dateObj.getDay()];
                                                           const hoursWorked = weekData.dailyHours?.[dateStr] || 0;
                                                           const dayExpenses = weekData.expenses.filter(e => e.dateStr === dateStr);
                                                           const dayTotal = dayExpenses.reduce((s, e) => s + e.amount, 0);

                                                           return (
                                                               <button 
                                                                 key={dateStr}
                                                                 onClick={() => setSelectedDay({weekKey, dateStr})}
                                                                 className="w-full flex items-center justify-between p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                                                               >
                                                                   <div className="flex items-center gap-3">
                                                                       <div className="bg-gray-100 text-gray-600 font-bold text-xs w-10 h-10 rounded-xl flex flex-col items-center justify-center">
                                                                           <span>{dateObj.getMonth() + 1}.{dateObj.getDate()}</span>
                                                                       </div>
                                                                       <div className="text-left">
                                                                           <div className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                                                               {dayLabel}
                                                                               {hoursWorked > 0 && <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded">工 {hoursWorked}h</span>}
                                                                           </div>
                                                                           <div className="text-xs text-gray-400 mt-0.5">
                                                                               {dayExpenses.length} 笔支出
                                                                           </div>
                                                                       </div>
                                                                   </div>
                                                                   
                                                                   <div className="flex items-center gap-2">
                                                                       <div className="text-right">
                                                                           <p className="text-sm font-bold text-gray-800">-¥{dayTotal.toFixed(1)}</p>
                                                                       </div>
                                                                       <ChevronRight size={16} className="text-gray-300" />
                                                                   </div>
                                                               </button>
                                                           );
                                                       })}
                                                   </div>
                                               )}
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