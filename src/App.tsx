import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Server, Power, Usb, Info, Download, Settings } from 'lucide-react';
import { UPSMetrics, UPSEvent, HistoryDataPoint } from './types';
import { MetricCard } from './components/MetricCard';

import { SystemCharts } from './components/Charts';
import { EventLog } from './components/EventLog';
import { VerticalMeter } from './components/VerticalMeter';
import { SettingsModal, ThresholdSettings } from './components/SettingsModal';
import { cn } from './lib/utils';

// Helper to generate jitter
const jitter = (value: number, maxVariance: number) => {
  return +(value + (Math.random() * maxVariance * 2 - maxVariance)).toFixed(2);
};

const INITIAL_METRICS: UPSMetrics = {
  status: 'ONLINE',
  batteryLevel: 100,
  
  // Adjusted to match screenshot readings exactly
  batteryVoltage1: 647,
  outputPowerFactor: 0.82,
  outputCurrentU: 10.0,
  outputFrequency: 50.0,
  dcVoltage: 647,
  inputFrequency: 49.9,
  batteryCurrent1: 0,
  
  outputVoltageU: 232,
  outputLoadU: 20,
  inputVoltageR: 230,

  temperature: 30.5,
  estimatedRuntime: 45,
};

let globalDeferredPrompt: any = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  globalDeferredPrompt = e;
  window.dispatchEvent(new Event('deferredpromptready'));
});

export default function App() {
  const [metrics, setMetrics] = useState<UPSMetrics>(INITIAL_METRICS);
  const [events, setEvents] = useState<UPSEvent[]>([
    { id: 'initial', timestamp: new Date(), type: 'INFO', message: 'System initialized. Ready to connect.' }
  ]);
  const [history, setHistory] = useState<HistoryDataPoint[]>([]);
  
  const [simulationMode, setSimulationMode] = useState<'NORMAL' | 'OUTAGE' | 'SERIAL'>('NORMAL');
  const [isSerialConnected, setIsSerialConnected] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [thresholds, setThresholds] = useState<ThresholdSettings>(() => {
    const saved = localStorage.getItem('ups_thresholds');
    return saved ? JSON.parse(saved) : { 
      maxLoad: 80, 
      minBatteryVoltage: 500, 
      maxBatteryVoltage: 700,
      baudRate: 9600,
      dataBits: 8,
      stopBits: 1
    };
  });

  const serialReaderRef = useRef<any>(null);

  const handleSaveSettings = (newSettings: ThresholdSettings) => {
    setThresholds(newSettings);
    localStorage.setItem('ups_thresholds', JSON.stringify(newSettings));
    setIsSettingsOpen(false);
    addEvent('INFO', 'Settings updated successfully.');
  };

  // PWA Install Prompt handling
  useEffect(() => {
    const handleReady = () => {
      setDeferredPrompt(globalDeferredPrompt);
      if (globalDeferredPrompt) {
        setIsInstallable(true);
        console.log('PWA prompt ready from global');
      }
    };

    if (globalDeferredPrompt) {
      handleReady();
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      globalDeferredPrompt = e;
      setIsInstallable(true);
      console.log('PWA prompt ready');
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
      console.log('PWA app installed');
      addEvent('INFO', 'PWA App installed successfully via browser.');
    };

    window.addEventListener('deferredpromptready', handleReady);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
       setIsInstallable(false);
    } else {
       // We'll show the button anyway to provide guidance to the user
       setIsInstallable(true);
    }

    return () => {
      window.removeEventListener('deferredpromptready', handleReady);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
        addEvent('INFO', 'PWA App installed successfully.');
      }
      setDeferredPrompt(null);
    } else {
      // Explain why they can't install right now
      if (window.self !== window.top) {
        alert("PWA Installation is blocked inside the preview iframe. Please click the 'Open in New Tab' icon (top right arrow) to install this application.");
      } else {
         alert("The installation prompt is not available yet. Please use the 'install' icon in your browser's address bar or menu, or wait a few seconds and try again.");
      }
    }
  };

  const addEvent = useCallback((type: 'INFO' | 'WARNING' | 'CRITICAL', message: string) => {
    setEvents(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      type,
      message
    }, ...prev].slice(0, 50));
  }, []);

  // Web Serial API Connection
  const connectSerial = async () => {
    try {
      const navSerial = (navigator as any).serial;
      if (!navSerial) {
        addEvent('CRITICAL', 'Web Serial API not supported in this environment. Open app in a new tab.');
        alert('Web Serial is only supported in Chrome/Edge outside of cross-origin iframes. Please click "Open externally" or use a new tab.');
        return;
      }
      
      const port = await navSerial.requestPort();
      await port.open({ 
        baudRate: thresholds.baudRate || 9600,
        dataBits: thresholds.dataBits || 8,
        stopBits: thresholds.stopBits || 1,
        // parity is usually 'none' by default which matches the common 9600, 8, N, 1 setup
      });
      
      setIsSerialConnected(true);
      setSimulationMode('SERIAL');
      addEvent('INFO', 'COM Port Connected via RS232 USB. Awaiting protocol stream...');
      
      // Async Read Loop
      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      serialReaderRef.current = reader;

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          // In a real Liebert SEC/Megatec scenario, parse 'value' (e.g. "(230.0 230.0 ...")
          // Here we just log and flash a connection indicator
          console.log("[SERIAL RX]:", value);
          
          // Random dummy update strictly to show data processing
          setMetrics(prev => ({
            ...prev,
            inputVoltageR: prev.inputVoltageR + (Math.random() > 0.5 ? 0.1 : -0.1)
          }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        reader.releaseLock();
      }

    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        addEvent('WARNING', 'Port selection cancelled.');
      } else if (err.name === 'SecurityError' || (err.message && err.message.includes('permissions policy'))) {
        addEvent('CRITICAL', 'Serial access blocked by iframe policy. Open app in a new tab.');
        alert('Web Serial is blocked in this embedded preview due to iframe security policies (Permissions Policy). Please click "Open in New Tab" to use the RS232 Serial connection feature.');
      } else {
        console.error('Serial connect error:', err);
        addEvent('CRITICAL', `COM Port Connection Failed: ${err.message}`);
      }
    }
  };

  // Simulation Loop (runs when not connected via serial)
  useEffect(() => {
    if (simulationMode === 'SERIAL') return;

    const tick = setInterval(() => {
      const now = new Date();
      const timeStr = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now);

      setMetrics(prev => {
        let newMetrics = { ...prev };
        
        // Jitter readouts to simulate living meters like the snapshot
        newMetrics.outputLoadU = Math.max(0, Math.min(100, jitter(prev.outputLoadU, 1.5)));
        newMetrics.outputCurrentU = +(newMetrics.outputLoadU * 0.5).toFixed(1); // Approximate current relation
        newMetrics.temperature = jitter(prev.temperature, 0.1);
        
        // Stable DC Buss / Battery variations
        newMetrics.dcVoltage = jitter(647, 0.5);
        newMetrics.batteryVoltage1 = newMetrics.dcVoltage; 
        newMetrics.outputPowerFactor = jitter(0.82, 0.01);
        
        if (simulationMode === 'NORMAL') {
          newMetrics.inputVoltageR = jitter(230, 1.5);
          newMetrics.inputFrequency = jitter(49.9, 0.05);
          newMetrics.outputVoltageU = jitter(232, 0.5); 
          newMetrics.outputFrequency = 50.0;
          newMetrics.batteryCurrent1 = 0; // Float mode generally shows 0 Amps DC
          
          if (prev.status === 'ON_BATTERY') {
            newMetrics.status = 'ONLINE';
            addEvent('INFO', 'Power restored. Switched to line power.');
          }

          if (newMetrics.batteryLevel < 100) {
            newMetrics.batteryLevel = Math.min(100, prev.batteryLevel + 0.5);
            newMetrics.batteryCurrent1 = 15; // Charging current
          }
        } else if (simulationMode === 'OUTAGE') {
          // Internal outage mode
          newMetrics.inputVoltageR = jitter(0, 2); 
          newMetrics.inputFrequency = 0;
          newMetrics.outputVoltageU = jitter(232, 0.5);
          newMetrics.outputFrequency = 49.9;
          
          if (prev.status === 'ONLINE') {
             newMetrics.status = 'ON_BATTERY';
             addEvent('CRITICAL', 'Input power disconnected! Discharging.');
          }

          const drainRate = (newMetrics.outputLoadU / 100) * 1.5;
          newMetrics.batteryLevel = Math.max(0, prev.batteryLevel - drainRate);
          newMetrics.batteryCurrent1 = -25; // Discharging current
          newMetrics.dcVoltage = Math.max(500, prev.dcVoltage - drainRate * 2);
          newMetrics.batteryVoltage1 = newMetrics.dcVoltage;
        }

        const runtimeCoef = 40;
        newMetrics.estimatedRuntime = Math.max(0, (newMetrics.batteryLevel * runtimeCoef) / Math.max(1, newMetrics.outputLoadU));

        setHistory(h => {
          const newHistory = [...h, {
            time: timeStr,
            batteryLevel: Math.round(newMetrics.batteryLevel),
            outputLoadU: Math.round(newMetrics.outputLoadU),
            inputVoltageR: Math.round(newMetrics.inputVoltageR)
          }];
          return newHistory.slice(-40);
        });

        return newMetrics;
      });
    }, 2000);

    return () => clearInterval(tick);
  }, [simulationMode, addEvent]);

  // Pre-fill history charts
  useEffect(() => {
    const initialHistory: HistoryDataPoint[] = [];
    let d = new Date();
    d.setMinutes(d.getMinutes() - 10);
    for(let i=0; i<40; i++) {
       d.setSeconds(d.getSeconds() + 2);
       initialHistory.push({
         time: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(d),
         batteryLevel: 100,
         outputLoadU: 20 + Math.random() * 2,
         inputVoltageR: 230 + Math.random() * 2 - 1
       });
    }
    setHistory(initialHistory);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-6 flex flex-col">
      <div className="max-w-[1400px] mx-auto w-full space-y-4 flex flex-col flex-grow">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/50 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Server className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Emerson Liebert RG Monitor <span className="text-slate-500 font-medium text-sm ml-2">RS232</span></h1>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
                COM PROTOCOL: {isSerialConnected ? 'ACTIVE' : 'SIMULATION'} // 
                <span className={metrics.status === 'ONLINE' ? 'text-emerald-400' : metrics.status === 'ON_BATTERY' ? 'text-yellow-400' : 'text-red-400'}>{metrics.status}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors flex items-center gap-2 border bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              <Settings className="w-4 h-4" />
            </button>
            
            {isInstallable && (
              <button 
                onClick={handleInstallClick}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors flex items-center gap-2 border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
              >
                <Download className="w-4 h-4" />
                Install App
              </button>
            )}
            
            {/* New Web Serial button */}
            <button 
              onClick={connectSerial}
              disabled={isSerialConnected}
              className={cn(
                "px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors flex items-center gap-2 border",
                isSerialConnected 
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 cursor-not-allowed" 
                  : "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
              )}
            >
              <Usb className="w-4 h-4" />
              {isSerialConnected ? 'Connected (COM3)' : 'Connect RS232'}
            </button>

            <button 
              onClick={() => setSimulationMode(prev => prev === 'NORMAL' ? 'OUTAGE' : 'NORMAL')}
              className={cn(
                "px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors flex items-center gap-2 border",
                simulationMode === 'SERIAL' ? 'hidden' : '', // Hidden when using real serial
                simulationMode === 'NORMAL' 
                  ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" 
                  : "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
              )}
            >
              <Power className="w-4 h-4" />
              {simulationMode === 'NORMAL' ? 'Test Demo App' : 'Restore Line Data'}
            </button>
            <div className={cn(
              "px-4 py-2 rounded-full font-bold uppercase tracking-wider text-xs flex items-center gap-2 border shadow-sm",
              metrics.status === 'ONLINE' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : metrics.status === 'ON_BATTERY' ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
              : "bg-red-500/10 text-red-400 border-red-500/20"
            )}>
              <div className={cn("w-2 h-2 rounded-full", metrics.status === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : metrics.status === 'ON_BATTERY' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500')} />
              {metrics.status.replace('_', ' ')}
            </div>
          </div>
        </header>

        {/* Dashboard Grid - Inspired by screenshot */}
        <main className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 flex-grow">
          
          {/* Vertical Meters (matches right panel GUI) */}
          <VerticalMeter 
            title="Out Voltage U-N"
            value={metrics.outputVoltageU}
            max={400}
            unit="VOLTS"
            colorClass="bg-fuchsia-500"
            className="lg:col-span-2 lg:row-span-3"
          />
          <VerticalMeter 
            title="Output Load U"
            value={metrics.outputLoadU}
            max={100}
            unit="PERCENT"
            colorClass="bg-blue-500"
            className="lg:col-span-2 lg:row-span-3"
            alert={metrics.outputLoadU > thresholds.maxLoad}
          />
          <VerticalMeter 
            title="In Voltage R-N"
            value={metrics.inputVoltageR}
            max={400}
            unit="RMS VOLTS"
            colorClass="bg-red-500"
            className="lg:col-span-2 lg:row-span-3"
          />
          
          {/* Readings Matrix (matches left panel GUI) */}
          <div className="lg:col-span-6 lg:row-span-3 grid grid-cols-2 md:grid-cols-3 gap-4">
            <MetricCard
               title="Battery Voltage #1"
               value={metrics.batteryVoltage1.toFixed(0)}
               unit="V DC"
               alert={metrics.batteryVoltage1 < thresholds.minBatteryVoltage || metrics.batteryVoltage1 > thresholds.maxBatteryVoltage}
            />
            <MetricCard
               title="DC Voltage"
               value={metrics.dcVoltage.toFixed(0)}
               unit="V DC"
               alert={metrics.dcVoltage < thresholds.minBatteryVoltage || metrics.dcVoltage > thresholds.maxBatteryVoltage}
            />
            <MetricCard
               title="Output PF"
               value={metrics.outputPowerFactor.toFixed(2)}
               subType="EFFICIENCY"
            />
            <MetricCard
               title="Output Current U"
               value={metrics.outputCurrentU.toFixed(1)}
               unit="RMS A"
            />
            <MetricCard
               title="Battery Current #1"
               value={metrics.batteryCurrent1}
               unit="A DC"
               alert={metrics.batteryCurrent1 < 0}
               subType={metrics.batteryCurrent1 < 0 ? 'DISCHARGING' : 'FLOAT'}
            />
            <MetricCard
               title="Output Freq"
               value={metrics.outputFrequency.toFixed(1)}
               unit="Hz"
            />
            <MetricCard
               title="Input Freq"
               value={metrics.inputFrequency.toFixed(1)}
               unit="Hz"
               alert={metrics.inputFrequency < 45 && metrics.inputFrequency > 0}
            />
             <MetricCard
               title="Temperature"
               value={metrics.temperature.toFixed(1)}
               unit="°C"
            />
             <MetricCard
               title="Calculated Runtime"
               value={Math.round(metrics.estimatedRuntime)}
               unit="m"
               alert={metrics.estimatedRuntime < 15 && metrics.status === 'ON_BATTERY'}
               subType="BATTERY"
            />
          </div>

          <SystemCharts data={history} className="md:col-span-6 lg:col-span-8 lg:row-span-2 min-h-[300px]" />
          <EventLog events={events} className="md:col-span-6 lg:col-span-4 lg:row-span-2" />
          
        </main>
        
        {/* Footer */}
        <footer className="mt-2 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-600 px-2 pb-2">
          <div className="flex flex-wrap gap-4 md:gap-8 text-[10px] uppercase font-bold tracking-widest justify-center">
            <div className="flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(59,130,246,0.5)]"></span>
               Connection: {isSerialConnected ? 'Web Serial API COM' : 'Internal Sim Test'}
            </div>
            <div className="flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>
               Uptime: 142d 12h 05m
            </div>
            <div className="flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>
               Firmware: SEC Rev 4.2
            </div>
          </div>
          <div className="text-[10px] font-mono flex items-center gap-2">
            <Info className="w-3 h-3 text-slate-400" />
            Serial Requires Chrome/Edge browser.
          </div>
        </footer>

        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          settings={thresholds}
          onSave={handleSaveSettings}
        />

      </div>
    </div>
  );
}


