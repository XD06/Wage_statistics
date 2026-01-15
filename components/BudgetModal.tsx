import React, { useState, useEffect } from 'react';
import { X, DollarSign, Clock, Moon, Sun } from 'lucide-react';
import { ShiftMode } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentBudget: number;
  currentHourlyRate: number;
  currentShift: ShiftMode;
  onSave: (budget: number, hourlyRate: number, shift: ShiftMode) => void;
}

const BudgetModal: React.FC<Props> = ({ isOpen, onClose, currentBudget, currentHourlyRate, currentShift, onSave }) => {
  const [budgetVal, setBudgetVal] = useState('');
  const [rateVal, setRateVal] = useState('');
  const [shiftVal, setShiftVal] = useState<ShiftMode>('day');

  useEffect(() => {
    if (isOpen) {
      setBudgetVal(currentBudget > 0 ? currentBudget.toString() : '168');
      setRateVal(currentHourlyRate > 0 ? currentHourlyRate.toString() : '');
      setShiftVal(currentShift || 'day');
    }
  }, [isOpen, currentBudget, currentHourlyRate, currentShift]);

  // Auto-set rate when shift changes to Night, but allow override if user insists (though prompt says 23)
  const handleShiftChange = (mode: ShiftMode) => {
      setShiftVal(mode);
      if (mode === 'night') {
          setRateVal('23');
      }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const b = parseFloat(budgetVal);
    const r = parseFloat(rateVal);
    
    if (isNaN(b) || b < 0) {
      alert("请输入有效的餐补金额");
      return;
    }
    if (isNaN(r) || r < 0) {
      alert("请输入有效的时薪");
      return;
    }

    onSave(b, r, shiftVal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-bold text-gray-800">设置工作与薪资参数</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Shift Selection */}
          <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">当前班次模式</label>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleShiftChange('day')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${shiftVal === 'day' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                      <Sun size={16} />
                      白班
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShiftChange('night')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${shiftVal === 'night' ? 'bg-gray-800 text-indigo-300 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                      <Moon size={16} />
                      晚班
                  </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                  {shiftVal === 'day' ? '白班模式：自定义时薪，常规就餐时间分类。' : '晚班模式：建议时薪 ¥23，日夜颠倒的就餐分类。'}
              </p>
          </div>

          {/* Hourly Rate */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Clock size={16} className="text-blue-500" />
              每小时工价 (元/小时)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={rateVal}
                onChange={(e) => setRateVal(e.target.value)}
                placeholder="例如：30"
                className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xl font-bold text-gray-900"
              />
            </div>
            {shiftVal === 'night' && rateVal !== '23' && (
                <p className="text-xs text-orange-500 mt-1">注意：晚班标准时薪通常为 ¥23</p>
            )}
          </div>

          {/* Subsidy */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
               <DollarSign size={16} className="text-green-500" />
               每周餐补总额 (元)
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                value={budgetVal}
                onChange={(e) => setBudgetVal(e.target.value)}
                placeholder="例如：168"
                className="w-full px-4 py-3 bg-green-50 border border-green-100 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-xl font-bold text-gray-900"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              按周累计结算。本周总消费超过此金额部分将从工资扣除。
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-colors shadow-lg"
          >
            保存设置
          </button>
        </form>
      </div>
    </div>
  );
};

export default BudgetModal;