
export interface VitalSigns {
  temperature: string; // Celsius (e.g., "36.5" or "36.5-37.0")
  heartRate: string; // bpm
  respiratoryRate: string; // bpm
  bloodPressureSys: string; // mmHg
  bloodPressureDia: string; // mmHg
  oxygenSaturation: string; // %
  capillaryBloodGlucose: string; // mg/dL
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

export interface DailyLog {
  id: string;
  date: string; // ISO Date string
  vitalSigns: VitalSigns;
  notes: string; // Free text, renamed from nursingNotes
  prescriptions: string[]; // Bullet points
  conducts: Conduct[]; // Renamed from procedures, now with verification
  labs: LabResult[];
  fluidBalance?: FluidBalance; // New field for ICU fluid tracking
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file';
  url: string; // Base64 data or URL
  date: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Masculino' | 'Feminino' | 'Outro';
  estimatedWeight?: number; // New field for weight in kg
  bedNumber: string;
  unit: 'UTI' | 'Enfermaria' | 'Arquivo Morto'; // Added Arquivo Morto
  status: 'active' | 'completed' | 'deleted'; // Added 'deleted' for soft delete logic
  admissionDate: string;
  admissionHistory: string; // New text field
  personalHistory: string[]; // New list
  homeMedications: string[]; // New list
  medicalPrescription: string; // New text field for current hospital prescription
  // ICU Specific Fields
  vasoactiveDrugs?: string;
  sedationAnalgesia?: string;
  devices?: string;
  diagnosticHypotheses: string[]; // Bullet points
  dailyLogs: DailyLog[];
  attachments: Attachment[]; // New field for files and photos
}
