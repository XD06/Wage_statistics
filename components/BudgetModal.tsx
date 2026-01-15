import React, { useState, useEffect } from 'react';
import { X, DollarSign, Clock, Moon, Sun } from 'lucide-react';
import { ShiftMode } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentDailySubsidy: number;
  currentHourlyRate: number;
  currentShift: ShiftMode;
  onSave: (dailySubsidy: number, hourlyRate: number, shift: ShiftMode) => void;
}

const BudgetModal: React.FC<Props> = ({ isOpen, onClose, currentDailySubsidy, currentHourlyRate, currentShift, onSave }) => {
  const [dailyVal, setDailyVal] = useState('');
  const [rateVal, setRateVal] = useState('');
  const [shiftVal, setShiftVal] = useState<ShiftMode>('day');

  useEffect(() => {
    if (isOpen) {
      setDailyVal(currentDailySubsidy > 0 ? currentDailySubsidy.toString() : '28');
      setRateVal(currentHourlyRate > 0 ? currentHourlyRate.toString() : '');
      setShiftVal(currentShift || 'day');
    }
  }, [isOpen, currentDailySubsidy, currentHourlyRate, currentShift]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const d = parseFloat(dailyVal);
    const r = parseFloat(rateVal);
    
    if (isNaN(d) || d < 0) {
      alert("请输入有效的日餐补金额");
      return;
    }
    if (isNaN(r) || r < 0) {
      alert("请输入有效的时薪");
      return;
    }

    onSave(d, r, shiftVal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-white/20">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-extrabold text-gray-900">参数配置</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Shift Selection */}
          <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">工作班次</label>
              <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setShiftVal('day'); }}
                    className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all border-2 ${shiftVal === 'day' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100'}`}
                  >
                      <Sun size={24} className={shiftVal === 'day' ? 'text-orange-500' : 'text-gray-300'} />
                      <span className="text-sm font-bold">白班</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShiftVal('night'); setRateVal('23'); }}
                    className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all border-2 ${shiftVal === 'night' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100'}`}
                  >
                      <Moon size={24} className={shiftVal === 'night' ? 'text-indigo-500' : 'text-gray-300'} />
                      <span className="text-sm font-bold">晚班</span>
                  </button>
              </div>
          </div>

          {/* Hourly Rate */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
              时薪 (¥/h)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={rateVal}
                onChange={(e) => setRateVal(e.target.value)}
                placeholder="0"
                className="w-full px-5 py-4 bg-gray-50 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xl font-bold text-gray-900 transition-all border border-transparent focus:border-transparent"
              />
            </div>
          </div>

          {/* Daily Subsidy */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
               日补标准 (¥/天)
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                value={dailyVal}
                onChange={(e) => setDailyVal(e.target.value)}
                placeholder="28"
                className="w-full px-5 py-4 bg-gray-50 rounded-2xl focus:bg-white focus:ring-2 focus:ring-green-500 outline-none text-xl font-bold text-gray-900 transition-all border border-transparent focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-black hover:bg-gray-900 text-white font-bold rounded-2xl transition-transform active:scale-95 shadow-xl"
          >
            保存配置
          </button>
        </form>
      </div>
    </div>
  );
};

export default BudgetModal;