import React, { useState, useMemo } from 'react';
import { AppState } from '../types';
import { getWeekRangeDisplay } from '../services/dateService';
import { WEEK_DAYS } from '../constants';
import DailyDetail from './DailyDetail';
import { ChevronDown, ChevronRight, Download, Calendar, TrendingUp, Trash2 } from 'lucide-react';
import { exportData } from '../services/storageService';

interface Props {
  data: AppState;
  onDeleteExpense: (weekKey: string, expenseId: string) => void;
  onUpdateHistoryHours: (weekKey: string, dateStr: string, hours: number) => void;
  onDeleteDay: (weekKey: string, dateStr: string) => void;
}

const History: React.FC<Props> = ({ data, onDeleteExpense, onUpdateHistoryHours, onDeleteDay }) => {
  // Filter and group weeks by month
  const weeksByMonth = useMemo(() => {
      const groups: Record<string, string[]> = {};
      Object.keys(data.weeks).sort((a, b) => b.localeCompare(a)).forEach(weekKey => {
          const wd = data.weeks[weekKey];
          
          // --- Ghost Week Check ---
          // A week is considered "active" only if it has meaningful data:
          // 1. Has expenses
          // 2. Has recorded work hours (> 0)
          // 3. Has days marked as 'Work Day' (true) - implies subsidy entitlement
          
          const hasExpenses = wd.expenses && wd.expenses.length > 0;
          const hasHours = wd.dailyHours && Object.values(wd.dailyHours).some(h => h > 0);
          const hasWorkDays = wd.workDays && Object.values(wd.workDays).some(isWork => isWork === true);
          
          // If the week has absolutely no data, treat it as a "ghost record" and hide it
          if (!hasExpenses && !hasHours && !hasWorkDays) {
              return;
          }

          const monthKey = weekKey.substring(0, 7);
          if (!groups[monthKey]) groups[monthKey] = [];
          groups[monthKey].push(weekKey);
      });
      return groups;
  }, [data.weeks]);

  const sortedMonths = Object.keys(weeksByMonth).sort((a, b) => b.localeCompare(a));
  const [selectedDay, setSelectedDay] = useState<{weekKey: string, dateStr: string} | null>(null);

  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>(() => {
      const first = sortedMonths[0];
      return first ? { [first]: true } : {};
  });
  
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});

  const toggleMonth = (m: string) => setExpandedMonths(prev => ({ ...prev, [m]: !prev[m] }));
  const toggleWeek = (w: string) => setExpandedWeeks(prev => ({ ...prev, [w]: !prev[w] }));

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
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
       <div className="flex justify-between items-center px-2 pt-2">
            <div>
                <h2 className="text-2xl font-extrabold text-gray-900">历史账单</h2>
                <p className="text-xs text-gray-400 font-medium mt-1">所有周期的收支记录</p>
            </div>
            <button 
                onClick={() => exportData(data)}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
            >
                <Download size={14} />
                导出数据
            </button>
       </div>

       {sortedMonths.length === 0 && (
           <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                   <Calendar className="text-gray-300 w-8 h-8" />
               </div>
               <p className="text-gray-400 font-medium">暂无历史记录</p>
           </div>
       )}

       {sortedMonths.map(monthKey => {
           const [year, month] = monthKey.split('-');
           const weekKeys = weeksByMonth[monthKey];
           const isMonthExpanded = expandedMonths[monthKey];

           let monthWage = 0;
           let monthNet = 0;
           weekKeys.forEach(wk => {
               const wd = data.weeks[wk];
               const totalHours = Object.values(wd.dailyHours || {}).reduce((s, h) => s + h, 0);
               const wage = totalHours * (wd.hourlyRate || 0);
               const totalSpent = wd.expenses.reduce((s, e) => s + e.amount, 0);
               
               // Re-calculate budget based on work days
               const activeDays = Object.values(wd.workDays || {}).filter(Boolean).length;
               const budget = activeDays * (wd.dailySubsidy || 0);
               
               const excess = Math.max(0, totalSpent - budget);
               monthWage += wage;
               monthNet += (wage - excess);
           });

           return (
               <div key={monthKey} className="space-y-3">
                   <button 
                     onClick={() => toggleMonth(monthKey)}
                     className={`w-full flex items-center justify-between p-5 rounded-[24px] shadow-sm transition-all duration-300 group ${isMonthExpanded ? 'bg-black text-white' : 'bg-white text-gray-800 hover:shadow-md'}`}
                   >
                       <div className="flex items-center gap-4">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isMonthExpanded ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                               <span className="text-sm font-bold">{month}月</span>
                           </div>
                           <div className="text-left">
                               <h3 className="text-lg font-bold">{year}</h3>
                               <p className={`text-xs font-medium ${isMonthExpanded ? 'text-gray-400' : 'text-gray-400'}`}>净入统计</p>
                           </div>
                       </div>
                       <div className="text-right">
                           <p className={`text-2xl font-bold tracking-tight ${isMonthExpanded ? 'text-green-400' : 'text-green-600'}`}>¥{monthNet.toFixed(0)}</p>
                           <div className={`flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-wider ${isMonthExpanded ? 'text-gray-500' : 'text-gray-300'}`}>
                               <TrendingUp size={12} />
                               Month Total
                           </div>
                       </div>
                   </button>

                   {isMonthExpanded && (
                       <div className="space-y-4 pl-2 animate-in slide-in-from-top-2 duration-300">
                           {weekKeys.map(weekKey => {
                               const weekData = data.weeks[weekKey];
                               const rangeStr = getWeekRangeDisplay(weekKey);
                               const isWeekExpanded = expandedWeeks[weekKey];
                               
                               const totalHours = Object.values(weekData.dailyHours || {}).reduce((s, h) => s + h, 0);
                               const wage = totalHours * (weekData.hourlyRate || 0);
                               const totalSpent = weekData.expenses.reduce((s, e) => s + e.amount, 0);
                               
                               const activeDays = Object.values(weekData.workDays || {}).filter(Boolean).length;
                               const budget = activeDays * (weekData.dailySubsidy || 0);
                               
                               const weekExcess = Math.max(0, totalSpent - budget);
                               const netIncome = wage - weekExcess;

                               // Collect dates that have ANY data (expenses, hours, OR are marked as work days)
                               const datesWithData = new Set<string>();
                               weekData.expenses.forEach(e => datesWithData.add(e.dateStr));
                               Object.keys(weekData.dailyHours || {}).forEach(d => {
                                   if (weekData.dailyHours[d] > 0) datesWithData.add(d);
                               });
                               Object.keys(weekData.workDays || {}).forEach(d => {
                                   if (weekData.workDays[d]) datesWithData.add(d);
                               });
                               
                               const sortedDates = Array.from(datesWithData).sort((a, b) => b.localeCompare(a));

                               return (
                                   <div key={weekKey} className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden">
                                       <button 
                                          onClick={() => toggleWeek(weekKey)}
                                          className="w-full p-4 hover:bg-gray-50 transition-colors"
                                       >
                                           <div className="flex justify-between items-center mb-3">
                                               <span className="font-bold text-gray-800 text-xs bg-gray-100 px-2 py-1 rounded-lg">
                                                   {rangeStr}
                                               </span>
                                               {isWeekExpanded ? <ChevronDown size={16} className="text-gray-400"/> : <ChevronRight size={16} className="text-gray-400"/>}
                                           </div>
                                           <div className="grid grid-cols-3 gap-2">
                                                <div className="bg-gray-50 rounded-xl p-2 text-center">
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">工时</p>
                                                    <p className="font-bold text-gray-800">{totalHours}<span className="text-xs text-gray-400 font-normal">h</span></p>
                                                </div>
                                                <div className="bg-gray-50 rounded-xl p-2 text-center">
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">出勤</p>
                                                    <p className="font-bold text-gray-800">{activeDays}<span className="text-xs text-gray-400 font-normal">天</span></p>
                                                </div>
                                                <div className="bg-gray-50 rounded-xl p-2 text-center">
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">实收</p>
                                                    <p className={`font-bold ${weekExcess > 0 ? 'text-red-500' : 'text-green-600'}`}>¥{netIncome.toFixed(0)}</p>
                                                </div>
                                           </div>
                                       </button>

                                       {isWeekExpanded && (
                                           <div className="border-t border-gray-50 bg-white px-2 pb-2">
                                               {sortedDates.length === 0 ? (
                                                   <p className="text-center text-xs text-gray-300 py-4">本周无记录</p>
                                               ) : (
                                                   <div className="pt-2 space-y-1">
                                                       {sortedDates.map(dateStr => {
                                                           const dateObj = new Date(dateStr);
                                                           const dayLabel = WEEK_DAYS[dateObj.getDay()];
                                                           const hoursWorked = weekData.dailyHours?.[dateStr] || 0;
                                                           const dayExpenses = weekData.expenses.filter(e => e.dateStr === dateStr);
                                                           const dayTotal = dayExpenses.reduce((s, e) => s + e.amount, 0);
                                                           const isWorkDay = weekData.workDays?.[dateStr];

                                                           return (
                                                               <div 
                                                                 key={dateStr}
                                                                 onClick={() => setSelectedDay({weekKey, dateStr})}
                                                                 className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group/item cursor-pointer"
                                                               >
                                                                   <div className="flex items-center gap-3">
                                                                       <div className="text-left w-8">
                                                                           <p className="text-[10px] font-bold text-gray-400">{dateObj.getMonth() + 1}月</p>
                                                                           <p className="text-sm font-bold text-gray-800">{dateObj.getDate()}</p>
                                                                       </div>
                                                                       <div className="h-6 w-px bg-gray-100"></div>
                                                                       <div className="text-left">
                                                                           <div className="text-xs font-bold text-gray-700 flex items-center gap-2">
                                                                               {dayLabel}
                                                                               {isWorkDay && !hoursWorked && !dayTotal && (
                                                                                   <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" title="已标记为工作日"></span>
                                                                               )}
                                                                           </div>
                                                                           {hoursWorked > 0 && <p className="text-[10px] text-blue-500 font-medium">工时 {hoursWorked}h</p>}
                                                                       </div>
                                                                   </div>
                                                                   
                                                                   <div className="flex items-center gap-2">
                                                                       {dayTotal > 0 && <span className="text-xs font-bold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">-¥{dayTotal.toFixed(0)}</span>}
                                                                       
                                                                       <button 
                                                                           onClick={(e) => {
                                                                               e.stopPropagation();
                                                                               onDeleteDay(weekKey, dateStr);
                                                                           }}
                                                                           className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover/item:opacity-100"
                                                                           title="删除当天记录"
                                                                       >
                                                                           <Trash2 size={14} />
                                                                       </button>

                                                                       <ChevronRight size={14} className="text-gray-200 group-hover/item:text-gray-400" />
                                                                   </div>
                                                               </div>
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