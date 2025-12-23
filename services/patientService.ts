
import { supabase } from '../lib/supabase';
import { Patient, DailyLog, Attachment, Device } from '../types';

/**
 * Extrai uma mensagem de erro legível de quase qualquer objeto de erro.
 * Resolve o problema do [object Object] nos alertas.
 */
const getErrorMessage = (error: any): string => {
  if (!error) return 'Erro desconhecido';
  if (typeof error === 'string') return error;
  
  // Erros do Supabase/Postgrest costumam ter message, details ou hint
  if (error.message) {
    let msg = error.message;
    if (error.details) msg += ` (Detalhes: ${error.details})`;
    if (error.hint) msg += ` (Dica: ${error.hint})`;
    return msg;
  }
  
  if (error.error_description) return error.error_description;
  if (error.error && typeof error.error === 'object') return getErrorMessage(error.error);

  try {
    return JSON.stringify(error);
  } catch (e) {
    return String(error);
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
  homeMedications: Array.isArray(p.home_medications) ? p.home_medications : [],
  medicalPrescription: p.medical_prescription || '',
  vasoactiveDrugs: p.vasoactive_drugs || '',
  sedationAnalgesia: p.sedation_analgesia || '',
  devices_list: Array.isArray(p.devices_list) ? p.devices_list : [],
  ventilation: p.ventilation || { mode: 'Espontânea', fio2: '21', peep: '0', rate: '0', volume: '0', pressure: '0' },
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
  date: a.created_at
});

// --- Services ---

export const fetchPatients = async (): Promise<Patient[]> => {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select(`*, daily_logs (*), attachments (*)`)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapPatientFromDB);
  } catch (err) {
    console.error('Erro ao buscar pacientes:', getErrorMessage(err));
    return [];
  }
};

/**
 * Cria um paciente com suporte a fallback caso colunas novas não existam no banco.
 */
export const createPatient = async (patientData: Omit<Patient, 'id' | 'dailyLogs' | 'attachments'>): Promise<Patient | null> => {
  // 1. Definir colunas básicas (que provavelmente existem em qualquer versão da tabela)
  const corePayload = {
    name: String(patientData.name || 'Novo Paciente').toUpperCase(),
    age: Number(patientData.age) || 0,
    gender: patientData.gender || 'Masculino',
    bed_number: String(patientData.bedNumber || '?').toUpperCase(),
    unit: patientData.unit || 'UTI',
    status: 'active',
    admission_date: patientData.admissionDate || new Date().toISOString().split('T')[0],
    estimated_weight: Number(patientData.estimatedWeight) || 0,
    admission_history: patientData.admissionHistory || '',
    medical_prescription: patientData.medicalPrescription || '',
  };

  // 2. Definir colunas estendidas (novas colunas de UTI/Estruturadas)
  const extendedPayload = {
    ...corePayload,
    personal_history: Array.isArray(patientData.personalHistory) ? patientData.personalHistory : [],
    home_medications: Array.isArray(patientData.homeMedications) ? patientData.homeMedications : [],
    diagnostic_hypotheses: Array.isArray(patientData.diagnosticHypotheses) ? patientData.diagnosticHypotheses : [],
    vasoactive_drugs: patientData.vasoactiveDrugs || '',
    sedation_analgesia: patientData.sedationAnalgesia || '',
    devices_list: Array.isArray(patientData.devices_list) ? patientData.devices_list : [],
    ventilation: patientData.ventilation || { mode: 'Espontânea', fio2: '21', peep: '0', rate: '0', volume: '0', pressure: '0' }
  };

  try {
    console.log('Tentando inserção completa...');
    const { data, error } = await supabase.from('patients').insert(extendedPayload).select().single();

    if (error) {
      // Se o erro for de coluna inexistente, tenta o payload básico
      if (error.message?.includes('column') && error.message?.includes('not found')) {
        console.warn('Detectado erro de esquema. Tentando inserção simplificada...', error.message);
        const { data: retryData, error: retryError } = await supabase.from('patients').insert(corePayload).select().single();
        
        if (retryError) throw retryError;
        return { ...mapPatientFromDB(retryData), dailyLogs: [], attachments: [] };
      }
      throw error;
    }
    
    return { ...mapPatientFromDB(data), dailyLogs: [], attachments: [] };
  } catch (err: any) {
    const finalMsg = getErrorMessage(err);
    console.error('%cFalha Crítica na Criação:', 'color: white; background: red; font-weight: bold', finalMsg);
    throw new Error(finalMsg);
  }
};

export const updatePatient = async (patientId: string, updates: Partial<Patient>) => {
  try {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.age !== undefined) dbUpdates.age = Number(updates.age);
    if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
    if (updates.estimatedWeight !== undefined) dbUpdates.estimated_weight = Number(updates.estimatedWeight);
    if (updates.bedNumber !== undefined) dbUpdates.bed_number = updates.bedNumber;
    if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.admissionDate !== undefined) dbUpdates.admission_date = updates.admissionDate;
    if (updates.admissionHistory !== undefined) dbUpdates.admission_history = updates.admissionHistory;
    if (updates.personalHistory !== undefined) dbUpdates.personal_history = updates.personalHistory;
    if (updates.homeMedications !== undefined) dbUpdates.home_medications = updates.homeMedications;
    if (updates.medicalPrescription !== undefined) dbUpdates.medical_prescription = updates.medicalPrescription;
    if (updates.diagnosticHypotheses !== undefined) dbUpdates.diagnostic_hypotheses = updates.diagnosticHypotheses;
    if (updates.vasoactiveDrugs !== undefined) dbUpdates.vasoactive_drugs = updates.vasoactiveDrugs;
    if (updates.sedationAnalgesia !== undefined) dbUpdates.sedation_analgesia = updates.sedationAnalgesia;
    if (updates.devices_list !== undefined) dbUpdates.devices_list = updates.devices_list;
    if (updates.ventilation !== undefined) dbUpdates.ventilation = updates.ventilation;

    const { error } = await supabase.from('patients').update(dbUpdates).eq('id', patientId);
    if (error) {
       console.error('Update Error:', error);
       throw error;
    }
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
      prescriptions: Array.isArray(log.prescriptions) ? log.prescriptions : [],
      conducts: Array.isArray(log.conducts) ? log.conducts : [],
      labs: Array.isArray(log.labs) ? log.labs : [],
      fluid_balance: log.fluidBalance
    };

    const { data: existing } = await supabase
      .from('daily_logs')
      .select('id')
      .eq('patient_id', patientId)
      .eq('date', log.date)
      .maybeSingle();

    let result;
    if (existing) {
      result = await supabase.from('daily_logs').update(payload).eq('id', existing.id).select().single();
    } else {
      result = await supabase.from('daily_logs').insert(payload).select().single();
    }

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
