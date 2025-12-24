
import { supabase } from '../lib/supabase';
import { Patient, DailyLog, Attachment, Device } from '../types';

/**
 * Converte erros em strings legíveis, evitando o problema de "[object Object]".
 */
const getErrorMessage = (error: any): string => {
  if (!error) return 'Erro desconhecido';
  if (typeof error === 'string') return error;
  
  // Tratamento para erro retornado pelo Supabase
  if (error.message && typeof error.message === 'string') {
    return error.message;
  }
  
  // Tratamento para erro de rede ou objeto genérico
  try {
    return JSON.stringify(error);
  } catch (e) {
    return 'Erro complexo ao processar requisição';
  }
};

// --- Mappers ---
const mapPatientFromDB = (p: any): Patient => ({
  id: p.id,
  name: p.name || 'Paciente sem Nome',
  age: Number(p.age) || 0,
  gender: p.gender || 'Masculino',
  estimatedWeight: Number(p.estimated_weight) || 0,
  bedNumber: p.bed_number || 'S/N',
  unit: p.unit || 'UTI',
  status: p.status || 'active',
  admissionDate: p.admission_date || new Date().toISOString(),
  admissionHistory: p.admission_history || '',
  personalHistory: Array.isArray(p.personal_history) ? p.personal_history : [],
  // Fix: Removed duplicate 'home_medications' property which is not in the Patient type
  homeMedications: Array.isArray(p.home_medications) ? p.home_medications : [],
  medicalPrescription: p.medical_prescription || '',
  vasoactiveDrugs: p.vasoactive_drugs || '',
  sedationAnalgesia: p.sedation_analgesia || '',
  devices_list: [], 
  // Fornecemos um objeto default para ventilation já que a coluna não existe no banco
  ventilation: { mode: 'Espontânea', fio2: '21', peep: '0', rate: '0', volume: '0', pressure: '0' },
  diagnosticHypotheses: Array.isArray(p.diagnostic_hypotheses) ? p.diagnostic_hypotheses : [],
  dailyLogs: p.daily_logs ? p.daily_logs.map(mapLogFromDB) : [],
  attachments: p.attachments ? p.attachments.map(mapAttachmentFromDB) : []
});

const mapLogFromDB = (l: any): DailyLog => ({
  id: l.id,
  date: l.date,
  vitalSigns: l.vital_signs || {},
  notes: l.notes || '',
  prescriptions: Array.isArray(l.prescriptions) ? l.prescriptions : [],
  conducts: Array.isArray(l.conducts) ? l.conducts : [],
  labs: Array.isArray(l.labs) ? l.labs : [],
  fluidBalance: l.fluid_balance
});

const mapAttachmentFromDB = (a: any): Attachment => ({
  id: a.id,
  name: a.name,
  type: a.type as 'image' | 'file',
  url: a.url,
  date: a.created_at || a.date,
  status: 'active'
});

// --- Services ---

export const fetchPatients = async (): Promise<Patient[]> => {
  try {
    // Removemos 'ventilation' da seleção para evitar erro 42703
    const { data, error } = await supabase
      .from('patients')
      .select(`
        id, name, age, gender, estimated_weight, bed_number, unit, status, 
        admission_date, admission_history, personal_history, home_medications, 
        medical_prescription, vasoactive_drugs, sedation_analgesia, 
        diagnostic_hypotheses, created_at,
        daily_logs (*), 
        attachments (id, name, type, url, created_at)
      `)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapPatientFromDB);
  } catch (err) {
    console.error('Erro ao buscar pacientes:', getErrorMessage(err));
    return [];
  }
};

export const createPatient = async (patientData: any): Promise<Patient | null> => {
  // Payload seguro sem a coluna ventilation
  const payload: any = {
    name: String(patientData.name || 'Novo Paciente').toUpperCase(),
    age: Number(patientData.age) || 0,
    gender: patientData.gender || 'Masculino',
    estimated_weight: Number(patientData.estimatedWeight) || 0,
    bed_number: String(patientData.bedNumber || '?').toUpperCase(),
    unit: patientData.unit || 'UTI',
    status: 'active',
    admission_date: patientData.admissionDate,
    admission_history: patientData.admissionHistory || '',
    personal_history: patientData.personalHistory || [],
    home_medications: patientData.homeMedications || [],
    medical_prescription: patientData.medicalPrescription || '',
    diagnostic_hypotheses: patientData.diagnosticHypotheses || [],
    vasoactive_drugs: patientData.vasoactiveDrugs || '',
    sedation_analgesia: patientData.sedationAnalgesia || ''
  };

  try {
    const { data, error } = await supabase.from('patients').insert(payload).select().single();
    if (error) throw error;
    return mapPatientFromDB(data);
  } catch (err) {
    const detailedError = getErrorMessage(err);
    console.error('Falha na criação do paciente:', detailedError);
    throw new Error(detailedError);
  }
};

export const updatePatient = async (patientId: string, updates: Partial<Patient>): Promise<void> => {
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name.toUpperCase();
  if (updates.age !== undefined) dbUpdates.age = Number(updates.age);
  if (updates.estimatedWeight !== undefined) dbUpdates.estimated_weight = Number(updates.estimatedWeight);
  if (updates.bedNumber !== undefined) dbUpdates.bed_number = updates.bedNumber.toUpperCase();
  if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.admissionDate !== undefined) dbUpdates.admission_date = updates.admissionDate;
  if (updates.medicalPrescription !== undefined) dbUpdates.medical_prescription = updates.medicalPrescription;
  if (updates.diagnosticHypotheses !== undefined) dbUpdates.diagnostic_hypotheses = updates.diagnosticHypotheses;
  if (updates.vasoactiveDrugs !== undefined) dbUpdates.vasoactive_drugs = updates.vasoactiveDrugs;
  if (updates.personalHistory !== undefined) dbUpdates.personal_history = updates.personalHistory;
  if (updates.homeMedications !== undefined) dbUpdates.home_medications = updates.homeMedications;

  try {
    const { error } = await supabase.from('patients').update(dbUpdates).eq('id', patientId);
    if (error) throw error;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
};

export const upsertDailyLog = async (patientId: string, log: DailyLog) => {
  try {
    const payload = {
      patient_id: patientId,
      date: log.date,
      vital_signs: log.vitalSigns,
      notes: log.notes,
      prescriptions: log.prescriptions || [],
      conducts: log.conducts || [],
      labs: log.labs || [],
      fluid_balance: log.fluidBalance
    };
    const { data: existing } = await supabase.from('daily_logs').select('id').eq('patient_id', patientId).eq('date', log.date).maybeSingle();
    let result;
    if (existing) result = await supabase.from('daily_logs').update(payload).eq('id', existing.id).select().single();
    else result = await supabase.from('daily_logs').insert(payload).select().single();
    if (result.error) throw result.error;
    return mapLogFromDB(result.data);
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
};

export const deleteDailyLog = async (logId: string) => {
  try {
    const { error } = await supabase.from('daily_logs').delete().eq('id', logId);
    if (error) throw error;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
};

export const addAttachment = async (patientId: string, attachment: Omit<Attachment, 'id'>) => {
  try {
    const payload = {
      patient_id: patientId,
      name: attachment.name,
      type: attachment.type,
      url: attachment.url
    };
    const { data, error } = await supabase
      .from('attachments')
      .insert(payload)
      .select('id, name, type, url, created_at')
      .single();
      
    if (error) throw error;
    return mapAttachmentFromDB(data);
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
};

export const deleteAttachment = async (attachmentId: string) => {
  try {
    const { error } = await supabase
      .from('attachments')
      .delete()
      .eq('id', attachmentId);
    if (error) throw error;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
};
