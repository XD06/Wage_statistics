import React, { useState, useEffect } from 'react';
import { X, Sun, Moon, Cloud, Save, Download, CheckCircle, AlertCircle, Settings2, ShieldAlert } from 'lucide-react';
import { ShiftMode, WebDAVConfig, AppState } from '../types';
import { uploadToWebDAV, downloadFromWebDAV } from '../services/webdavService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentDailySubsidy: number;
  currentHourlyRate: number;
  currentShift: ShiftMode;
  currentWebDAV?: WebDAVConfig;
  fullDataState: AppState; // Need full state for testing upload
  onSave: (dailySubsidy: number, hourlyRate: number, shift: ShiftMode, webdav: WebDAVConfig) => void;
  onRestoreData: (newData: AppState) => void;
}

type Tab = 'general' | 'cloud';

const BudgetModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  currentDailySubsidy, 
  currentHourlyRate, 
  currentShift, 
  currentWebDAV,
  fullDataState,
  onSave,
  onRestoreData
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('general');

  // General Settings
  const [dailyVal, setDailyVal] = useState('');
  const [rateVal, setRateVal] = useState('');
  const [shiftVal, setShiftVal] = useState<ShiftMode>('day');

  // WebDAV Settings
  const [webdavEnabled, setWebdavEnabled] = useState(false);
  const [davUrl, setDavUrl] = useState('');
  const [davUser, setDavUser] = useState('');
  const [davPass, setDavPass] = useState('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  // Mixed Content Check
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const isHttpUrl = davUrl.trim().toLowerCase().startsWith('http:');
  const showMixedContentWarning = isHttps && isHttpUrl;

  useEffect(() => {
    if (isOpen) {
      setDailyVal(currentDailySubsidy > 0 ? currentDailySubsidy.toString() : '28');
      setRateVal(currentHourlyRate > 0 ? currentHourlyRate.toString() : '');
      setShiftVal(currentShift || 'day');
      
      if (currentWebDAV) {
        setWebdavEnabled(currentWebDAV.enabled);
        setDavUrl(currentWebDAV.url || '');
        setDavUser(currentWebDAV.username || '');
        setDavPass(currentWebDAV.password || '');
      }
    }
  }, [isOpen, currentDailySubsidy, currentHourlyRate, currentShift, currentWebDAV]);

  if (!isOpen) return null;

  const constructWebDAVConfig = (): WebDAVConfig => ({
    enabled: webdavEnabled,
    url: davUrl,
    username: davUser,
    password: davPass
  });

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

    onSave(d, r, shiftVal, constructWebDAVConfig());
    onClose();
  };

  const handleTestUpload = async () => {
    setSyncStatus('loading');
    setStatusMsg('正在尝试连接并上传...');
    try {
        const config = constructWebDAVConfig();
        if (!config.url || !config.username || !config.password) {
            throw new Error("请填写完整的 WebDAV 信息");
        }
        // Temporarily enable for the test
        config.enabled = true; 
        
        await uploadToWebDAV(fullDataState, config);
        setSyncStatus('success');
        setStatusMsg('连接成功！数据已备份到云端');
        // Auto enable if successful
        setWebdavEnabled(true);
    } catch (e: any) {
        setSyncStatus('error');
        setStatusMsg(e.message || "连接失败，请检查跨域(CORS)设置或账号密码");
    }
  };

  const handleRestore = async () => {
      if (!confirm("确定要从云端恢复数据吗？这将覆盖当前的本地记录。")) return;
      
      setSyncStatus('loading');
      setStatusMsg('正在下载数据...');
      try {
          const config = constructWebDAVConfig();
          const data = await downloadFromWebDAV(config);
          if (data) {
              setSyncStatus('success');
              setStatusMsg('恢复成功！');
              onRestoreData(data);
              // Save the config used to restore as the active config
              onSave(
                  data.currentDailySubsidySetting, 
                  data.currentHourlyRateSetting, 
                  data.currentShiftSetting, 
                  { ...config, enabled: true }
              );
              setTimeout(() => onClose(), 1000);
          } else {
              setSyncStatus('error');
              setStatusMsg('云端没有找到备份文件');
          }
      } catch (e: any) {
          setSyncStatus('error');
          setStatusMsg(e.message || "下载失败");
      }
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

        {/* Tabs */}
        <div className="flex px-6 pt-4 gap-4 shrink-0">
            <button 
                type="button"
                onClick={() => setActiveTab('general')}
                className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'general' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}
            >
                基础参数
            </button>
            <button 
                type="button"
                onClick={() => setActiveTab('cloud')}
                className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'cloud' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400'}`}
            >
                <Cloud size={14} />
                云同步 (WebDAV)
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
            {activeTab === 'general' ? (
                <div className="space-y-6">
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
                </div>
            ) : (
                <div className="space-y-5">
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                        <p className="text-xs text-blue-700 leading-relaxed">
                            配置 WebDAV（如坚果云、Nextcloud）后，数据将在本地变动时自动备份到云端。重新部署后，只需填入信息并点击“从云端恢复”即可找回数据。
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">服务器地址 (URL)</label>
                            <input 
                                type="text" 
                                value={davUrl}
                                onChange={e => setDavUrl(e.target.value)}
                                placeholder="https://dav.jianguoyun.com/dav/"
                                className={`w-full px-4 py-3 rounded-xl text-sm font-medium focus:ring-2 outline-none transition-all ${showMixedContentWarning ? 'bg-red-50 focus:ring-red-500 text-red-900' : 'bg-gray-50 focus:bg-white focus:ring-blue-500'}`}
                            />
                            {/* Mixed Content Warning Banner */}
                            {showMixedContentWarning && (
                                <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs flex items-start gap-2 mt-2 border border-red-100 animate-in fade-in slide-in-from-top-1">
                                    <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                                    <div>
                                        <span className="font-bold block mb-0.5">协议不匹配 (Mixed Content)</span>
                                        当前网页为 HTTPS，无法访问 HTTP 服务器。请使用 <span className="font-bold">https://</span> 开头的地址，或为服务器配置 SSL。
                                    </div>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">账号 (Username)</label>
                            <input 
                                type="text" 
                                value={davUser}
                                onChange={e => setDavUser(e.target.value)}
                                placeholder="Email or Username"
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">应用密码 (Password)</label>
                            <input 
                                type="password" 
                                value={davPass}
                                onChange={e => setDavPass(e.target.value)}
                                placeholder="App Password"
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                    
                    {/* Sync Actions */}
                    <div className="pt-2 flex gap-3">
                         <button 
                            type="button"
                            onClick={handleTestUpload}
                            className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                         >
                             <Save size={14} />
                             测试连接并备份
                         </button>
                         <button 
                            type="button"
                            onClick={handleRestore}
                            className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-gray-50"
                         >
                             <Download size={14} />
                             从云端恢复
                         </button>
                    </div>

                    {/* Status Message */}
                    {syncStatus !== 'idle' && (
                        <div className={`flex items-center gap-2 text-xs font-bold p-3 rounded-xl ${syncStatus === 'success' ? 'bg-green-50 text-green-700' : syncStatus === 'error' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>
                            {syncStatus === 'loading' && <Settings2 size={14} className="animate-spin" />}
                            {syncStatus === 'success' && <CheckCircle size={14} />}
                            {syncStatus === 'error' && <AlertCircle size={14} />}
                            <span className="whitespace-pre-wrap">{statusMsg}</span>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-2 shrink-0 bg-white">
            <button
                type="submit"
                className="w-full py-4 bg-black hover:bg-gray-900 text-white font-bold rounded-2xl transition-transform active:scale-95 shadow-xl"
            >
                保存所有配置
            </button>
        </div>
      </form>
    </div>
  );
};

export default BudgetModal;