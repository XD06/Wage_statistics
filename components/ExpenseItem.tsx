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
    <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg mb-2 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${config.bg}`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
             <span className="font-medium text-gray-800">{expense.category}</span>
             <span className="text-xs text-gray-400">{timeStr}</span>
          </div>
          {expense.note && (
            <p className="text-xs text-gray-500 mt-0.5">{expense.note}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-bold text-gray-800">-{expense.amount.toFixed(2)}</span>
        <button 
          onClick={() => onDelete(expense.id)}
          className="text-gray-300 hover:text-red-500 transition-colors p-1"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default ExpenseItem;