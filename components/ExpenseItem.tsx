import React from 'react';
import { Expense } from '../types';
import { CATEGORY_CONFIG } from '../constants';
import { Trash2 } from 'lucide-react';

interface Props {
  expense: Expense;
  onDelete: (id: string) => void;
}

const ExpenseItem: React.FC<Props> = ({ expense, onDelete }) => {
  const config = CATEGORY_CONFIG[expense.category];
  const Icon = config.icon;
  const date = new Date(expense.timestamp);
  const timeStr = date.toTimeString().slice(0, 5);

  return (
    <div className="group flex items-center justify-between p-3 bg-white rounded-2xl hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bg}`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
             <span className="font-bold text-gray-900 text-sm">{expense.category}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
             <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{timeStr}</span>
             {expense.note && (
               <span className="text-xs text-gray-500 truncate max-w-[100px]">{expense.note}</span>
             )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-extrabold text-gray-900">- {expense.amount.toFixed(1)}</span>
        <button 
          onClick={() => onDelete(expense.id)}
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default ExpenseItem;