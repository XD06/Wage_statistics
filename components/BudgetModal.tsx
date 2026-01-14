import React, { useState, useEffect } from 'react';
import { X, DollarSign, Clock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentBudget: number;
  currentHourlyRate: number;
  onSave: (budget: number, hourlyRate: number) => void;
}

const BudgetModal: React.FC<Props> = ({ isOpen, onClose, currentBudget, currentHourlyRate, onSave }) => {
  const [budgetVal, setBudgetVal] = useState('');
  const [rateVal, setRateVal] = useState('');

  useEffect(() => {
    if (isOpen) {
      setBudgetVal(currentBudget > 0 ? currentBudget.toString() : '');
      setRateVal(currentHourlyRate > 0 ? currentHourlyRate.toString() : '');
    }
  }, [isOpen, currentBudget, currentHourlyRate]);

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

    onSave(b, r);
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
            <p className="text-xs text-gray-400 mt-1">用于计算每日和每周的工资收入</p>
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
            <p className="text-xs text-gray-500 mt-2 flex justify-between">
              <span>平均日补 (按6天)：</span>
              {budgetVal && !isNaN(parseFloat(budgetVal)) ? (
                <span className="text-green-600 font-bold">
                  ¥{(parseFloat(budgetVal) / 6).toFixed(1)} / 天
                </span>
              ) : '--'}
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