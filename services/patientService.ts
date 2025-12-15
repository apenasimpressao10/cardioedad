
import { supabase } from '../lib/supabase';
import { Patient, DailyLog, Attachment } from '../types';

// --- Mappers (DB Snake_case <-> App CamelCase) ---

const mapPatientFromDB = (p: any): Patient => ({
  id: p.id,
  name: p.name,
  age: p.age,
  gender: p.gender,
  estimatedWeight: p.estimated_weight,
  bedNumber: p.bed_number,
  unit: p.unit,
  status: p.status,
  admissionDate: p.admission_date,
  admissionHistory: p.admission_history || '',
  personalHistory: p.personal_history || [],
  homeMedications: p.home_medications || [],
  medicalPrescription: p.medical_prescription || '',
  vasoactiveDrugs: p.vasoactive_drugs,
  sedationAnalgesia: p.sedation_analgesia,
  devices: p.devices,
  diagnosticHypotheses: p.diagnostic_hypotheses || [],
  dailyLogs: p.daily_logs ? p.daily_logs.map(mapLogFromDB) : [],
  attachments: p.attachments ? p.attachments.map(mapAttachmentFromDB) : []
});

const mapLogFromDB = (l: any): DailyLog => ({
  id: l.id,
  date: l.date,
  vitalSigns: l.vital_signs,
  notes: l.notes,
  prescriptions: l.prescriptions || [],
  conducts: l.conducts || [],
  labs: l.labs || [],
  fluidBalance: l.fluid_balance
});

const mapAttachmentFromDB = (a: any): Attachment => ({
  id: a.id,
  name: a.name,
  type: a.type as 'image' | 'file',
  url: a.url,
  date: a.created_at
});

// --- Services ---

export const fetchPatients = async (): Promise<Patient[]> => {
  const { data, error } = await supabase
    .from('patients')
    .select(`
      *,
      daily_logs (*),
      attachments (*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching patients:', error);
    throw error;
  }

  return (data || []).map(mapPatientFromDB);
};

export const createPatient = async (patientData: Omit<Patient, 'id' | 'dailyLogs' | 'attachments'>): Promise<Patient | null> => {
  const dbPayload = {
    name: patientData.name,
    age: patientData.age,
    gender: patientData.gender,
    estimated_weight: patientData.estimatedWeight,
    bed_number: patientData.bedNumber,
    unit: patientData.unit,
    status: patientData.status,
    admission_date: patientData.admissionDate,
    admission_history: patientData.admissionHistory,
    personal_history: patientData.personalHistory,
    home_medications: patientData.homeMedications,
    medical_prescription: patientData.medicalPrescription,
    vasoactive_drugs: patientData.vasoactiveDrugs,
    sedation_analgesia: patientData.sedationAnalgesia,
    devices: patientData.devices,
    diagnostic_hypotheses: patientData.diagnosticHypotheses
  };

  const { data, error } = await supabase
    .from('patients')
    .insert(dbPayload)
    .select()
    .single();

  if (error) {
    console.error('Error creating patient:', error);
    throw error;
  }

  return { ...mapPatientFromDB(data), dailyLogs: [], attachments: [] };
};

export const updatePatient = async (patientId: string, updates: Partial<Patient>) => {
  // Map fields back to snake_case
  const dbUpdates: any = {};
  if (updates.name) dbUpdates.name = updates.name;
  if (updates.age) dbUpdates.age = updates.age;
  if (updates.gender) dbUpdates.gender = updates.gender;
  if (updates.estimatedWeight) dbUpdates.estimated_weight = updates.estimatedWeight;
  if (updates.bedNumber) dbUpdates.bed_number = updates.bedNumber;
  if (updates.unit) dbUpdates.unit = updates.unit;
  if (updates.status) dbUpdates.status = updates.status;
  if (updates.admissionDate) dbUpdates.admission_date = updates.admissionDate;
  if (updates.admissionHistory) dbUpdates.admission_history = updates.admissionHistory;
  if (updates.personalHistory) dbUpdates.personal_history = updates.personalHistory;
  if (updates.homeMedications) dbUpdates.home_medications = updates.homeMedications;
  if (updates.medicalPrescription) dbUpdates.medical_prescription = updates.medicalPrescription;
  if (updates.vasoactiveDrugs !== undefined) dbUpdates.vasoactive_drugs = updates.vasoactiveDrugs;
  if (updates.sedationAnalgesia !== undefined) dbUpdates.sedation_analgesia = updates.sedationAnalgesia;
  if (updates.devices !== undefined) dbUpdates.devices = updates.devices;
  if (updates.diagnosticHypotheses) dbUpdates.diagnostic_hypotheses = updates.diagnosticHypotheses;

  const { error } = await supabase
    .from('patients')
    .update(dbUpdates)
    .eq('id', patientId);

  if (error) throw error;
};

export const upsertDailyLog = async (patientId: string, log: DailyLog) => {
  // Check if it's a new log (generated ID in frontend usually numeric or random, UUID in DB)
  // For simplicity, if we pass an ID that looks like a UUID, we update, else insert.
  
  const payload = {
    patient_id: patientId,
    date: log.date,
    vital_signs: log.vitalSigns,
    notes: log.notes,
    prescriptions: log.prescriptions,
    conducts: log.conducts,
    labs: log.labs,
    fluid_balance: log.fluidBalance
  };

  // If the ID is a valid UUID, we include it to upsert. If it's a temp ID from frontend, we omit it to create new.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(log.id);
  
  let result;
  if (isUuid) {
      result = await supabase.from('daily_logs').update(payload).eq('id', log.id).select().single();
  } else {
      result = await supabase.from('daily_logs').insert(payload).select().single();
  }

  if (result.error) throw result.error;
  return mapLogFromDB(result.data);
};

export const uploadAttachment = async (patientId: string, file: File) => {
  // 1. Upload to Storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${patientId}/${Math.random().toString(36).substring(2)}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('patient-files')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  // 2. Get Public URL
  const { data: { publicUrl } } = supabase.storage
    .from('patient-files')
    .getPublicUrl(fileName);

  // 3. Create Record in DB
  const { data, error: dbError } = await supabase
    .from('attachments')
    .insert({
      patient_id: patientId,
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'file',
      url: publicUrl
    })
    .select()
    .single();

  if (dbError) throw dbError;
  return mapAttachmentFromDB(data);
};

export const deleteAttachment = async (attachmentId: string) => {
    // Note: To delete the actual file from storage, we'd need the path. 
    // For this prototype, we just delete the DB record.
    const { error } = await supabase.from('attachments').delete().eq('id', attachmentId);
    if (error) throw error;
};
