
export interface VitalSigns {
  temperature: string; // Celsius (e.g., "36.5" or "36.5-37.0")
  heartRate: string; // bpm
  respiratoryRate: string; // bpm
  bloodPressureSys: string; // mmHg
  bloodPressureDia: string; // mmHg
  oxygenSaturation: string; // %
  capillaryBloodGlucose: string; // mg/dL
}

export interface Ventilation {
  mode: 'Espontânea' | 'Cateter/CNAF' | 'VNI' | 'VM';
  fio2: string; // %
  peep: string; // cmH2O ou EPAP
  rate: string; // irpm
  volume: string; // ml
  pressure: string; // cmH2O (IPAP ou Pressão de Suporte/Insp)
  flow?: string; // L/min (para Cateter)
  subMode?: string; // VCV, PCV, PSV
}

export interface LabResult {
  testName: string;
  value: string | number;
  unit: string;
  referenceRange: string;
}

export interface Conduct {
  description: string;
  verified: boolean;
}

export interface FluidBalance {
  intake: number; // ml
  output: number; // ml
  net: number; // ml (calculated)
}

export interface Device {
  id: string;
  name: string;
  insertionDate: string;
}

export interface DailyLog {
  id: string;
  date: string; // ISO Date string
  vitalSigns: VitalSigns;
  notes: string; // Free text
  prescriptions: string[]; // Bullet points
  conducts: Conduct[]; 
  labs: LabResult[];
  fluidBalance?: FluidBalance; 
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file';
  url: string; 
  date: string;
  status: 'active' | 'inactive';
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Masculino' | 'Feminino' | 'Outro';
  estimatedWeight?: number; 
  bedNumber: string;
  unit: 'UTI' | 'Enfermaria' | 'Arquivo Morto'; 
  status: 'active' | 'completed' | 'deleted'; 
  admissionDate: string;
  admissionHistory: string; 
  personalHistory: string[]; 
  homeMedications: string[]; 
  medicalPrescription: string; 
  // ICU Structured Fields
  vasoactiveDrugs?: string;
  sedationAnalgesia?: string;
  devices_list?: Device[]; 
  ventilation?: Ventilation; 
  diagnosticHypotheses: string[]; 
  dailyLogs: DailyLog[];
  attachments: Attachment[]; 
}
