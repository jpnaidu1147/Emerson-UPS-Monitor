import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface ThresholdSettings {
  maxLoad: number;
  minBatteryVoltage: number;
  maxBatteryVoltage: number;
  baudRate: number;
  dataBits: number;
  stopBits: number;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ThresholdSettings;
  onSave: (settings: ThresholdSettings) => void;
}

export function SettingsModal({ isOpen, onClose, settings, onSave }: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<ThresholdSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-slate-800 rounded-xl">
               <SettingsIcon className="w-5 h-5 text-blue-400" />
             </div>
             <h2 className="text-xl font-bold tracking-tight text-white">App Settings</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-8 overflow-y-auto flex-1">
          
          {/* Serial Config Section */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Serial Configuration</h3>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               {/* Port Information */}
               <div className="space-y-2 col-span-2">
                 <label className="text-xs font-bold uppercase tracking-widest text-slate-400">COM Port</label>
                 <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between">
                   <span className="text-sm text-slate-300">Browser Native Selection (COM1-4, USB)</span>
                 </div>
                 <p className="text-[10px] text-slate-500">Note: For security, the browser will prompt you to select the precise COM port (COM1, COM2, etc.) when you click "Connect via Serial".</p>
               </div>

               {/* Baud Rate */}
               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Baud Rate</label>
                 <select 
                   value={localSettings.baudRate || 9600}
                   onChange={e => setLocalSettings(s => ({...s, baudRate: parseInt(e.target.value)}))}
                   className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                 >
                    <option value={2400}>2400</option>
                    <option value={4800}>4800</option>
                    <option value={9600}>9600</option>
                    <option value={19200}>19200</option>
                    <option value={38400}>38400</option>
                    <option value={57600}>57600</option>
                    <option value={115200}>115200</option>
                 </select>
               </div>
               
               {/* Data Bits */}
               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Data Bits</label>
                 <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
                    <button 
                      onClick={() => setLocalSettings(s => ({...s, dataBits: 7}))}
                      className={cn("flex-1 py-2 text-sm rounded-lg font-mono transition-colors", localSettings.dataBits === 7 ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white")}
                    >7</button>
                    <button 
                      onClick={() => setLocalSettings(s => ({...s, dataBits: 8}))}
                      className={cn("flex-1 py-2 text-sm rounded-lg font-mono transition-colors", (localSettings.dataBits === 8 || !localSettings.dataBits) ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white")}
                    >8</button>
                 </div>
               </div>

               {/* Stop Bits */}
               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Stop Bits</label>
                 <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
                    <button 
                      onClick={() => setLocalSettings(s => ({...s, stopBits: 1}))}
                      className={cn("flex-1 py-2 text-sm rounded-lg font-mono transition-colors", (localSettings.stopBits === 1 || !localSettings.stopBits) ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white")}
                    >1</button>
                    <button 
                      onClick={() => setLocalSettings(s => ({...s, stopBits: 2}))}
                      className={cn("flex-1 py-2 text-sm rounded-lg font-mono transition-colors", localSettings.stopBits === 2 ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white")}
                    >2</button>
                 </div>
               </div>
             </div>
             <p className="text-[10px] text-slate-500 leading-tight">Note: Connecting to a COM port natively uses the browser's secure hardware protocol selection dialog.</p>
          </div>

          <div className="w-full h-px bg-slate-800/50 my-4" />

          {/* Thresholds Section */}
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Alert Thresholds</h3>
            </div>
            
            {/* Load Threshold */}
            <div className="space-y-2">
              <label className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                <span>Max Load Warning (%)</span>
                <span className="text-blue-400">{localSettings.maxLoad}%</span>
              </label>
              <input 
                type="range" 
                min="0" max="100" 
                value={localSettings.maxLoad}
                onChange={(e) => setLocalSettings(s => ({...s, maxLoad: parseInt(e.target.value)}))}
                className="w-full accent-blue-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">Triggers visual alerts on Load meters and components when load exceeds this value.</p>
            </div>

            {/* Battery Min Voltage */}
            <div className="space-y-2">
              <label className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                <span>Min Battery Voltage (V DC)</span>
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  value={localSettings.minBatteryVoltage}
                  onChange={(e) => setLocalSettings(s => ({...s, minBatteryVoltage: parseInt(e.target.value) || 0}))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-red-500 transition-colors"
                />
                <span className="absolute right-4 top-3.5 text-slate-500 font-mono text-sm">V DC</span>
              </div>
            </div>

            {/* Battery Max Voltage */}
            <div className="space-y-2">
              <label className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                <span>Max Battery Voltage (V DC)</span>
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  value={localSettings.maxBatteryVoltage}
                  onChange={(e) => setLocalSettings(s => ({...s, maxBatteryVoltage: parseInt(e.target.value) || 0}))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-red-500 transition-colors"
                />
                <span className="absolute right-4 top-3.5 text-slate-500 font-mono text-sm">V DC</span>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end gap-3 shrink-0">
           <button 
             onClick={onClose}
             className="px-6 py-2.5 rounded-xl font-bold uppercase text-xs tracking-wider text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
           >
             Cancel
           </button>
           <button 
             onClick={() => onSave(localSettings)}
             className="px-6 py-2.5 rounded-xl font-bold uppercase text-xs tracking-wider text-white bg-blue-600 hover:bg-blue-500 flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
           >
             <Save className="w-4 h-4" />
             Save Settings
           </button>
        </div>

      </div>
    </div>
  );
}
