import React, { useState, useEffect } from 'react';
import { X, Sun, Moon, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { ShiftMode, AppState } from '../types';
import { loadFromServer, saveToServer } from '../services/apiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentDailySubsidy: number;
  currentHourlyRate: number;
  currentShift: ShiftMode;
  fullDataState: AppState;
  onSave: (dailySubsidy: number, hourlyRate: number, shift: ShiftMode) => void;
  onRestoreData: (newData: AppState) => void;
}

const BudgetModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  currentDailySubsidy, 
  currentHourlyRate, 
  currentShift, 
  fullDataState,
  onSave,
  onRestoreData
}) => {
  // General Settings
  const [dailyVal, setDailyVal] = useState('');
  const [rateVal, setRateVal] = useState('');
  const [shiftVal, setShiftVal] = useState<ShiftMode>('day');

  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

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

  const handleForceSync = async () => {
      setSyncStatus('loading');
      try {
          // 1. Try to load remote data
          const remoteData = await loadFromServer();
          if (remoteData) {
              if (confirm("服务器上有数据，是否覆盖当前本地数据？(点击取消则将本地数据强制上传覆盖服务器)")) {
                  onRestoreData(remoteData);
                  setSyncStatus('success');
              } else {
                  // User chose to keep local, so we push local to server
                  await saveToServer(fullDataState);
                  setSyncStatus('success');
              }
          } else {
              // No remote data, just upload
              await saveToServer(fullDataState);
              setSyncStatus('success');
          }
      } catch (e) {
          setSyncStatus('error');
      }
      
      setTimeout(() => setSyncStatus('idle'), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-white/20 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
          <h3 className="text-xl font-extrabold text-gray-900">设置</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
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

            <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-3 text-center">数据自动同步到您的私有服务器</p>
                <button 
                    type="button"
                    onClick={handleForceSync}
                    className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                    {syncStatus === 'loading' ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    {syncStatus === 'success' ? '同步成功' : syncStatus === 'error' ? '同步失败' : '手动同步数据'}
                </button>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-2 shrink-0 bg-white">
            <button
                type="submit"
                className="w-full py-4 bg-black hover:bg-gray-900 text-white font-bold rounded-2xl transition-transform active:scale-95 shadow-xl"
            >
                保存配置
            </button>
        </div>
      </form>
    </div>
  );
};

export default BudgetModal;