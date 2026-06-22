export type UPSStatus = 'ONLINE' | 'ON_BATTERY' | 'BYPASS' | 'FAULT';

export interface UPSMetrics {
  status: UPSStatus;
  batteryLevel: number;
  
  // Specific Liebert RG parameters matched to UI reference:
  inputVoltageR: number;    // Input Voltage R to Neutral (RMS Volts)
  outputVoltageU: number;   // Output Voltage U to Neutral (Volts)
  outputLoadU: number;      // Output Load U (%)
  batteryVoltage1: number;  // Volts DC
  outputPowerFactor: number;// 0.82
  outputCurrentU: number;   // RMS Amps
  outputFrequency: number;  // Hz
  dcVoltage: number;        // Volts DC
  inputFrequency: number;   // Hz
  batteryCurrent1: number;  // Amps DC

  // Additional stats for charts and battery component
  temperature: number;
  estimatedRuntime: number; // in minutes
}

export interface UPSEvent {
  id: string;
  timestamp: Date;
  type: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
}

export interface HistoryDataPoint {
  time: string;
  batteryLevel: number;
  outputLoadU: number;
  inputVoltageR: number;
}
