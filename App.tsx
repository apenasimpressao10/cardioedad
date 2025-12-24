
import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, BrainCircuit, PlusCircle, ChevronDown, ChevronUp, Menu, X, 
  ClipboardList, History, Pencil, Check, Trash2, 
  UserPlus, Printer, ArrowRightLeft, Pill, Microscope, HeartPulse, LogOut, Wind, Gauge, Calculator, Calendar, FlaskConical, AlertCircle, ArchiveRestore, Archive, FileText, Image as ImageIcon, Maximize2, Upload, Download, Weight, User, CheckSquare, Square, RefreshCw
} from 'lucide-react';
import { Patient, DailyLog, Device, Ventilation, Attachment, Conduct } from './types';
import DailyLogForm from './components/DailyLogForm';
import LabResultTable from './components/LabResultTable';
import { PatientPrintView, PatientListPrintView } from './components/PrintViews';
import * as PatientService from './services/patientService';

const safeString = (val: any): string => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return '';
  return String(val);
};

const stringifyError = (err: any): string => {
  if (!err) return 'Erro desconhecido';
  if (typeof err === 'string') return err;
  if (err.message && typeof err.message === 'string') return err.message;
  try {
    return JSON.stringify(err);
  } catch (e) {
    return 'Erro de sistema (objeto não serializável)';
  }
};

const INITIAL_NEW_PATIENT_STATE: Omit<Patient, 'id' | 'dailyLogs' | 'attachments'> = {
  name: '', 
  age: 0, 
  gender: 'Masculino', 
  estimatedWeight: 0, 
  bedNumber: '', 
  unit: 'UTI', 
  status: 'active',
  admissionDate: new Date().toISOString().split('T')[0], 
  admissionHistory: '', 
  medicalPrescription: '',
  personalHistory: [],
  homeMedications: [],
  diagnosticHypotheses: [],
  vasoactiveDrugs: '',
  sedationAnalgesia: '',
  devices_list: [], 
  ventilation: { mode: 'Espontânea', fio2: '21', peep: '0', rate: '0', volume: '0', pressure: '0' }
};

const DRUG_PRESETS = [
  { id: 'nora4', name: 'Nora 4 amp', mg: 16, ml: 250, unit: 'mg', calcType: 'mcg/kg/min' },
  { id: 'nora8', name: 'Nora 8 amp', mg: 32, ml: 250, unit: 'mg', calcType: 'mcg/kg/min' },
  { id: 'vaso', name: 'Vaso', mg: 20, ml: 100, unit: 'UI', calcType: 'UI/min' },
  { id: 'dobuta', name: 'Dobuta', mg: 250, ml: 250, unit: 'mg', calcType: 'mcg/kg/min' },
  { id: 'amioda', name: 'Amioda', mg: 600, ml: 250, unit: 'mg', calcType: 'mcg/kg/min' },
  { id: 'fenta', name: 'Fenta', mg: 2.5, ml: 250, unit: 'mg', calcType: 'mcg/kg/h' },
  { id: 'mida', name: 'Mida', mg: 100, ml: 100, unit: 'mg', calcType: 'mcg/kg/h' },
  { id: 'precedex', name: 'Precedex', mg: 0.2, ml: 100, unit: 'mg', calcType: 'mcg/kg/h' },
  { id: 'cetamina', name: 'Cetamina', mg: 500, ml: 50, unit: 'mg', calcType: 'mcg/kg/h' },
];

type PatientTabs = 'Resumo' | 'Laboratório' | 'UTI' | 'Evoluções' | 'Anexos';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'UTI' | 'Enfermaria'>('UTI');
  const [activePatientTab, setActivePatientTab] = useState<PatientTabs>('Resumo');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [collapsedLogs, setCollapsedLogs] = useState<Record<string, boolean>>({});

  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showPlantaoPrint, setShowPlantaoPrint] = useState(false);
  const [showFinalizedListModal, setShowFinalizedListModal] = useState(false);
  const [maximizedAttachment, setMaximizedAttachment] = useState<Attachment | null>(null);

  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [newPatientData, setNewPatientData] = useState(INITIAL_NEW_PATIENT_STATE);
  
  const [newDiagnosis, setNewDiagnosis] = useState('');
  const [editingDxIndex, setEditingDxIndex] = useState<number | null>(null);
  const [editingDxValue, setEditingDxValue] = useState('');
  const [newAntecedent, setNewAntecedent] = useState('');
  const [newHomeMed, setNewHomeMed] = useState('');
  const [transferTarget, setTransferTarget] = useState<string>('UTI');

  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceDate, setNewDeviceDate] = useState(new Date().toISOString().split('T')[0]);
  const [doseCalc, setDoseCalc] = useState({ drug: '', mg: '', ml: '', rate: '', result: '', unit: 'mg', calcType: 'mcg/kg/min' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isAuthenticated) loadPatients(); }, [isAuthenticated]);

  const loadPatients = async () => {
    setIsLoading(true);
    try { 
      const data = await PatientService.fetchPatients(); 
      setPatients(data || []); 
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPasswordInput('');
    setSelectedPatientId(null);
    setPatients([]);
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || null;
  const filteredPatients = (patients || []).filter(p => p.unit === activeTab && p.status === 'active');
  const finalizedPatients = (patients || []).filter(p => p.status === 'completed');
  const activeAttachments = selectedPatient?.attachments || [];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === '223209**') { setIsAuthenticated(true); }
    else { alert('Senha incorreta.'); setPasswordInput(''); }
  };

  const toggleLogSection = (id: string) => setCollapsedLogs(prev => ({ ...prev, [id]: !prev[id] }));

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingPatientId) {
        await PatientService.updatePatient(editingPatientId, newPatientData);
      } else {
        const p = await PatientService.createPatient(newPatientData as any);
        if (p) setSelectedPatientId(p.id);
      }
      await loadPatients();
      setShowAddPatientModal(false);
      setEditingPatientId(null);
      setNewPatientData(INITIAL_NEW_PATIENT_STATE);
    } catch (err: any) {
      const msg = stringifyError(err);
      alert(`Erro no Cadastro: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveLog = async (logData: Omit<DailyLog, 'id'>) => {
    if (!selectedPatientId) return;
    try {
      await PatientService.upsertDailyLog(selectedPatientId, { id: editingLog?.id || 'new', ...logData } as any);
      
      // Sincronização Bidirecional: Registro Diário -> Prescrição Geral
      const newPrescriptionText = (logData.prescriptions || []).join('\n');
      await PatientService.updatePatient(selectedPatientId, { medicalPrescription: newPrescriptionText });

      await loadPatients(); 
      setShowAddLogModal(false); 
      setEditingLog(null);
    } catch (err: any) { 
      alert(`Erro ao salvar registro clínico: ${stringifyError(err)}`); 
    }
  };

  const handleUpdateGeneralPrescription = async (newText: string) => {
    if (!selectedPatientId || !selectedPatient) return;
    
    // Atualiza localmente imediato
    setPatients(prev => prev.map(p => p.id === selectedPatientId ? { ...p, medicalPrescription: newText } : p));
    
    try {
      await PatientService.updatePatient(selectedPatientId, { medicalPrescription: newText });

      const logs = [...selectedPatient.dailyLogs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      if (logs.length > 0) {
        const lastLog = logs[0];
        const newPrescriptionArray = newText.split('\n').map(l => l.trim()).filter(l => l !== '');
        await PatientService.upsertDailyLog(selectedPatientId, { ...lastLog, prescriptions: newPrescriptionArray } as any);
      }
    } catch (err) {
      alert(`Erro ao sincronizar prescrição: ${stringifyError(err)}`);
      loadPatients();
    }
  };

  const updatePatientList = async (field: any, value: any, action: 'add' | 'remove' | 'edit' | 'reorder', index?: number) => {
    if (!selectedPatientId || !selectedPatient) return;
    let newList = [...(selectedPatient[field] || [])];
    if (action === 'add' && value) newList.push(value);
    else if (action === 'remove' && index !== undefined) newList.splice(index, 1);
    else if (action === 'edit' && index !== undefined && value) newList[index] = value;

    setPatients(prev => prev.map(p => p.id === selectedPatientId ? { ...p, [field]: newList } : p));

    try {
      await PatientService.updatePatient(selectedPatientId, { [field]: newList });
    } catch (err) {
      alert(`Erro ao salvar alteração: ${stringifyError(err)}`);
      loadPatients();
    }
  };

  const updateICUParams = async (updates: Partial<Patient>) => {
    if (!selectedPatientId) return;
    setPatients(prev => prev.map(p => p.id === selectedPatientId ? { ...p, ...updates } : p));
    try { 
      await PatientService.updatePatient(selectedPatientId, updates); 
    } catch (err) { 
      alert(`Erro ao sincronizar parâmetros: ${stringifyError(err)}`); 
      loadPatients();
    }
  };

  const handleToggleConductVerify = async (logId: string, conductIndex: number) => {
    if (!selectedPatient) return;
    const log = selectedPatient.dailyLogs.find(l => l.id === logId);
    if (!log) return;
    
    const newConducts = [...log.conducts];
    newConducts[conductIndex] = { ...newConducts[conductIndex], verified: !newConducts[conductIndex].verified };
    
    try {
      await PatientService.upsertDailyLog(selectedPatient.id, { ...log, conducts: newConducts } as any);
      await loadPatients();
    } catch (err) {
      alert(`Erro ao atualizar pendência: ${stringifyError(err)}`);
    }
  };

  const getPendingConducts = () => {
    if (!selectedPatient) return [];
    return selectedPatient.dailyLogs.flatMap(log => 
      log.conducts
        .map((c, idx) => ({ ...c, logId: log.id, index: idx, date: log.date }))
        .filter(c => !c.verified)
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handleVentilationModeChange = async (mode: Ventilation['mode']) => {
    if (!selectedPatientId || !selectedPatient) return;
    const baseVent = selectedPatient.ventilation || { fio2: '21', peep: '0', rate: '0', volume: '0', pressure: '0' };
    const updatedVent: Ventilation = { ...baseVent, mode };
    await updateICUParams({ ventilation: updatedVent });
  };

  const handleDrugPresetClick = (preset: typeof DRUG_PRESETS[0]) => {
    setDoseCalc({ drug: preset.name, mg: preset.mg.toString(), ml: preset.ml.toString(), rate: '', result: '', unit: preset.unit, calcType: preset.calcType });
  };

  const calculateDose = () => {
    const mg = parseFloat(doseCalc.mg);
    const ml = parseFloat(doseCalc.ml);
    const rate = parseFloat(doseCalc.rate);
    const weight = selectedPatient?.estimatedWeight || 70;
    if (isNaN(mg) || isNaN(ml) || isNaN(rate) || ml === 0) return;
    let res = 0;
    const concentration = mg / ml;
    if (doseCalc.calcType === 'mcg/kg/min') res = (rate * concentration * 1000) / (weight * 60);
    else if (doseCalc.calcType === 'mcg/kg/h') res = (rate * concentration * 1000) / weight;
    else if (doseCalc.calcType === 'UI/min') res = (rate * concentration) / 60;
    setDoseCalc(prev => ({ ...prev, result: res.toFixed(2) }));
  };

  const addDoseToText = () => {
    if (!doseCalc.result || !selectedPatient) return;
    const newEntry = `${doseCalc.drug}: ${doseCalc.rate} ml/h (${doseCalc.result} ${doseCalc.calcType})`;
    const current = safeString(selectedPatient.vasoactiveDrugs);
    const updated = current ? `${current}\n${newEntry}` : newEntry;
    updateICUParams({ vasoactiveDrugs: updated });
  };

  const handleConfirmTransfer = async () => {
    if (!selectedPatientId) return;
    const updates: Partial<Patient> = {};
    if (transferTarget === 'Finalizados') updates.status = 'completed';
    else { updates.unit = transferTarget as any; updates.status = 'active'; }

    setPatients(prev => prev.map(p => p.id === selectedPatientId ? { ...p, ...updates } : p));
    if (transferTarget === 'Finalizados') setSelectedPatientId(null);
    setShowTransferModal(false);

    try {
      await PatientService.updatePatient(selectedPatientId, updates);
      await loadPatients();
    } catch (err) { 
      alert(`Erro ao transferir: ${stringifyError(err)}`); 
      await loadPatients(); 
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPatientId) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        const newAttachment = {
          name: file.name,
          type: (file.type.startsWith('image/') ? 'image' : 'file') as 'image' | 'file',
          url: base64String,
          date: new Date().toISOString()
        };
        await PatientService.addAttachment(selectedPatientId, newAttachment as any);
        await loadPatients();
      } catch (err) { alert(`Erro no upload: ${stringifyError(err)}`); }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Excluir este anexo permanentemente?')) return;
    setPatients(prev => prev.map(p => ({ ...p, attachments: p.attachments?.filter(a => a.id !== id) || [] })));
    try {
      await PatientService.deleteAttachment(id);
      await loadPatients();
    } catch (err) { 
      alert(`Erro ao excluir: ${stringifyError(err)}`); 
      await loadPatients(); 
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 p-4 font-sans text-black">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-sm text-center border border-slate-700">
          <Activity className="text-medical-600 mb-4 mx-auto" size={48} />
          <h1 className="text-xl font-bold mb-6 tracking-tight uppercase text-black">CardioEDAD</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" autoFocus placeholder="Senha de Acesso" className="w-full border-2 border-slate-200 p-3 rounded-xl text-center outline-none focus:border-medical-500 font-medium text-black" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
            <button type="submit" className="w-full bg-medical-600 text-white p-3 rounded-xl font-bold shadow-lg hover:bg-medical-700 transition-all">Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  const pendingConductsList = getPendingConducts();

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans text-[13px] lg:text-[15px] text-black">
      <aside className={`fixed inset-y-0 left-0 z-40 lg:static transition-all duration-300 transform ${isSidebarOpen ? 'translate-x-0 w-64 lg:w-72' : '-translate-x-full lg:w-0 lg:overflow-hidden'} bg-slate-900 text-white flex flex-col shadow-xl border-r border-slate-700`}>
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2"><Activity className="text-medical-400" size={20} /><h1 className="font-bold text-base lg:text-lg tracking-tight">CardioEDAD</h1></div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white"><X size={24}/></button>
        </div>
        <div className="flex border-b border-slate-700 bg-slate-800">
          {['UTI', 'Enfermaria'].map(t => (
            <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === t ? 'bg-medical-600 text-white border-b-2 border-white' : 'text-slate-400 hover:text-white'}`}>{t}</button>
          ))}
        </div>
        <div className="p-3 space-y-2">
          <button onClick={() => { setEditingPatientId(null); setNewPatientData(INITIAL_NEW_PATIENT_STATE); setShowAddPatientModal(true); }} className="w-full flex items-center justify-center gap-2 bg-slate-700 p-2.5 rounded-xl text-[12px] font-bold border border-slate-600 hover:bg-slate-600 transition-all text-white shadow-sm uppercase"><UserPlus size={18} /> Novo Paciente</button>
          <button onClick={() => setShowPlantaoPrint(true)} className="w-full flex items-center justify-center gap-2 bg-slate-800 p-2.5 rounded-xl text-[11px] font-bold border border-slate-700 hover:bg-slate-700 transition-all text-slate-300 uppercase"><Printer size={16} /> Plantão</button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {isLoading && <div className="p-4 text-center text-slate-500 animate-pulse text-[10px] uppercase font-bold">Aguarde...</div>}
          {filteredPatients.map(p => (
            <div key={p.id} onClick={() => { setSelectedPatientId(p.id); setActivePatientTab('Resumo'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} className={`p-3 rounded-xl cursor-pointer transition-all border ${selectedPatientId === p.id ? 'bg-medical-700 border-white text-white shadow-md' : 'bg-transparent border-transparent hover:bg-slate-800'}`}>
              <div className="flex justify-between items-center">
                <span className="truncate pr-2 font-medium uppercase text-[11px]">{safeString(p.name)}</span>
                <span className="text-[9px] bg-black/40 px-2 py-0.5 rounded uppercase shrink-0 font-bold">{safeString(p.bedNumber)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 space-y-1 mt-auto border-t border-slate-700 bg-slate-900">
          <button onClick={() => setShowFinalizedListModal(true)} className="w-full flex items-center gap-2 text-[11px] text-slate-400 hover:text-white transition-colors py-2.5 px-3 rounded-xl hover:bg-slate-800 font-bold uppercase tracking-wider"><Archive size={16}/> Finalizados</button>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-[11px] text-slate-400 hover:text-white transition-colors py-2.5 px-3 rounded-xl hover:bg-slate-800 font-bold uppercase tracking-wider"><LogOut size={16}/> Sair</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        <header className="bg-slate-50 border-b px-4 lg:px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm z-30">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-white rounded-lg border border-slate-200 text-medical-700 hover:bg-slate-100 transition-all shadow-sm flex-shrink-0">
              <Menu size={20}/>
            </button>
            {selectedPatient ? (
              <div className="overflow-hidden">
                <h2 className="text-base lg:text-lg font-medium text-slate-900 leading-tight truncate uppercase tracking-tight">{safeString(selectedPatient.name)}</h2>
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] lg:text-[11px] font-normal text-slate-600 mt-1 uppercase items-center">
                  <span className="text-white bg-medical-700 px-2 py-1 rounded-md shadow-sm flex items-center gap-1.5 border border-medical-800">
                     <span className="text-[8px] font-bold opacity-70">LEITO</span> 
                     <span className="text-[12px] font-medium">{safeString(selectedPatient.bedNumber)}</span>
                  </span>
                  <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                    <User size={13} className="text-medical-600"/> 
                    {selectedPatient.age} ANOS
                  </span>
                  <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                    <Calendar size={13} className="text-orange-600"/> 
                    <span className="text-[9px] opacity-60 mr-0.5">ADM:</span> 
                    {new Date(selectedPatient.admissionDate).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-emerald-900 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 shadow-sm">
                    <Weight size={14} className="text-emerald-600"/> 
                    <span className="text-[12px]">{selectedPatient.estimatedWeight || '0'}</span> KG
                  </span>
                  <span className="bg-slate-800 text-white px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter">{selectedPatient.unit}</span>
                  <button onClick={() => { setEditingPatientId(selectedPatient.id); setNewPatientData({...selectedPatient}); setShowAddPatientModal(true); }} className="ml-1 text-medical-600 hover:text-medical-800 transition-colors flex items-center gap-1">
                    <Pencil size={11}/> <span className="underline">ALTERAR</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="font-medium text-slate-400 uppercase text-xs tracking-widest flex items-center gap-2">
                <Activity size={18}/> CardioEDAD Monitor
              </div>
            )}
          </div>
          {selectedPatient && (
            <div className="flex gap-2 w-full md:w-auto">
              <button onClick={() => setShowPrintPreview(true)} className="p-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 transition-all shadow-sm"><Printer size={18} /></button>
              <button onClick={() => setShowTransferModal(true)} className="flex-1 md:flex-none border border-slate-300 bg-white px-3 py-1.5 rounded-lg text-[9px] font-bold text-slate-900 uppercase hover:bg-slate-50 transition-all shadow-sm">Status</button>
              <button onClick={() => { setEditingLog(null); setShowAddLogModal(true); }} className="flex-1 md:flex-none bg-medical-600 text-white px-4 py-1.5 rounded-lg text-[9px] font-bold shadow-md uppercase hover:bg-medical-700 transition-all">Evolução</button>
            </div>
          )}
        </header>

        {/* PENDÊNCIAS GLOBAIS - FIXO ABAIXO DO HEADER */}
        {selectedPatient && pendingConductsList.length > 0 && (
          <div className="bg-orange-50 border-b border-orange-200 px-4 lg:px-6 py-2 shadow-inner z-20 flex flex-col gap-2">
             <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-orange-600" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-800">Pendências e Condutas Ativas</h3>
             </div>
             <div className="flex flex-wrap gap-2">
                {pendingConductsList.map((pending, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-orange-200 shadow-sm text-[11px] font-medium hover:border-orange-400 transition-all cursor-default group">
                    <button onClick={() => handleToggleConductVerify(pending.logId, pending.index)} className="text-slate-300 hover:text-emerald-600 transition-colors"><Square size={14}/></button>
                    <span className="text-slate-800 uppercase leading-none">{safeString(pending.description)}</span>
                    <span className="text-[8px] text-slate-400 font-bold ml-1">{new Date(pending.date).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}</span>
                  </div>
                ))}
             </div>
          </div>
        )}

        {selectedPatient ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex overflow-x-auto bg-slate-50 border-b border-slate-200 px-4">
               {['Resumo', 'Laboratório', 'UTI', 'Evoluções', 'Anexos'].map((tab) => {
                 if (tab === 'UTI' && selectedPatient.unit !== 'UTI') return null;
                 return (
                   <button 
                    key={tab} 
                    onClick={() => setActivePatientTab(tab as PatientTabs)}
                    className={`px-5 py-3 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activePatientTab === tab ? 'border-medical-600 text-medical-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                   >
                     {tab}
                   </button>
                 );
               })}
            </div>

            <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-white pb-20">
              {activePatientTab === 'Resumo' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                   {/* 1. HIPÓTESES DIAGNÓSTICAS */}
                   <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-2 bg-slate-100 border-b">
                      <h3 className="font-bold text-black text-[12px] uppercase tracking-wider flex items-center gap-2"><BrainCircuit size={18} className="text-medical-600"/> Hipóteses Diagnósticas</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex flex-col gap-2">
                        {selectedPatient.diagnosticHypotheses.map((dx, i) => (
                          <div key={i} className="flex items-center gap-2 group">
                            {editingDxIndex === i ? (
                              <div className="flex-1 flex gap-2">
                                <input autoFocus className="flex-1 border border-medical-300 px-3 py-1.5 rounded-lg text-[13px] text-black" value={editingDxValue} onChange={e => setEditingDxValue(e.target.value)} />
                                <button onClick={() => { updatePatientList('diagnosticHypotheses', editingDxValue, 'edit' as any, i); setEditingDxIndex(null); }} className="bg-medical-600 text-white px-3 rounded-lg"><Check size={16}/></button>
                                <button onClick={() => setEditingDxIndex(null)} className="bg-slate-200 px-3 rounded-lg"><X size={16}/></button>
                              </div>
                            ) : (
                              <>
                                <div className="flex-1 bg-slate-50 text-black px-3 py-1.5 rounded-lg border border-slate-200 font-medium text-[13px] flex items-center justify-between uppercase">
                                  {safeString(dx)}
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingDxIndex(i); setEditingDxValue(dx); }} className="p-1 text-slate-400 hover:text-medical-600"><Pencil size={14}/></button>
                                  </div>
                                </div>
                                <button onClick={() => updatePatientList('diagnosticHypotheses', null, 'remove', i)} className="text-slate-300 hover:text-red-600 p-1"><X size={18}/></button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-slate-50">
                        <input type="text" placeholder="Adicionar nova hipótese..." className="flex-1 bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm uppercase text-black" value={newDiagnosis} onChange={e => setNewDiagnosis(e.target.value)} onKeyDown={e => e.key === 'Enter' && (updatePatientList('diagnosticHypotheses', newDiagnosis, 'add'), setNewDiagnosis(''))} />
                        <button onClick={() => {updatePatientList('diagnosticHypotheses', newDiagnosis, 'add'); setNewDiagnosis('');}} className="bg-medical-600 text-white px-5 py-2 rounded-lg text-[11px] font-bold uppercase shadow-sm">Adicionar</button>
                      </div>
                    </div>
                   </section>

                   {/* 2. ANTECEDENTES & MEDICAÇÕES HABITUAIS */}
                   <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-2 bg-slate-100 border-b">
                      <h3 className="font-bold text-black text-[12px] uppercase tracking-wider flex items-center gap-2"><HeartPulse size={18} className="text-red-600"/> Antecedentes & Medicações Habituais</h3>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-widest border-b border-slate-50 mb-1">Passado Médico / Cirúrgico</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedPatient.personalHistory?.map((item, i) => (
                            <span key={i} className="bg-slate-50 text-black px-3 py-1 rounded border border-slate-200 font-medium text-[12px] flex items-center gap-2 uppercase">
                              {safeString(item)} <button onClick={() => updatePatientList('personalHistory', null, 'remove', i)} className="text-slate-300 hover:text-red-600"><X size={14}/></button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2 items-center">
                          <input type="text" placeholder="Novo antecedente..." className="flex-1 border-b border-slate-200 px-1 py-1 text-sm text-black outline-none focus:border-medical-500 uppercase" value={newAntecedent} onChange={e => setNewAntecedent(e.target.value)} onKeyDown={e => e.key === 'Enter' && (updatePatientList('personalHistory', newAntecedent, 'add'), setNewAntecedent(''))} />
                          <button onClick={() => {updatePatientList('personalHistory', newAntecedent, 'add'); setNewAntecedent('');}} className="text-medical-600"><PlusCircle size={20}/></button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-widest border-b border-slate-50 mb-1">Medicações Domiciliares</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedPatient.homeMedications?.map((item, i) => (
                            <span key={i} className="bg-medical-50 text-medical-900 px-3 py-1 rounded border border-medical-100 font-medium text-[12px] flex items-center gap-2 uppercase">
                              {safeString(item)} <button onClick={() => updatePatientList('homeMedications', null, 'remove', i)} className="text-medical-400 hover:text-red-600"><X size={14}/></button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2 items-center">
                          <input type="text" placeholder="Adicionar medicação..." className="flex-1 border-b border-slate-200 px-1 py-1 text-sm text-black outline-none focus:border-medical-500 uppercase" value={newHomeMed} onChange={e => setNewHomeMed(e.target.value)} onKeyDown={e => e.key === 'Enter' && (updatePatientList('homeMedications', newHomeMed, 'add'), setNewHomeMed(''))} />
                          <button onClick={() => {updatePatientList('homeMedications', newHomeMed, 'add'); setNewHomeMed('');}} className="text-medical-600"><PlusCircle size={20}/></button>
                        </div>
                      </div>
                    </div>
                   </section>

                   {/* 3. PRESCRIÇÃO MÉDICA ATUAL */}
                   <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-2 bg-blue-50 border-b flex items-center justify-between">
                      <h3 className="font-bold text-black text-[12px] uppercase tracking-wider flex items-center gap-2"><ClipboardList size={18} className="text-blue-600"/> Prescrição Médica Atual</h3>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-blue-400 uppercase tracking-tighter italic">
                         <RefreshCw size={12} className="animate-spin-slow" /> Sincronizada com Última Evolução
                      </div>
                    </div>
                    <div className="p-4">
                      <textarea 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-mono focus:border-blue-500 outline-none text-black leading-relaxed" 
                        rows={12} 
                        value={safeString(selectedPatient.medicalPrescription)} 
                        onChange={e => handleUpdateGeneralPrescription(e.target.value)} 
                        placeholder="Insira a prescrição completa aqui. Mudanças refletem na evolução diária..."
                      />
                    </div>
                   </section>
                </div>
              )}

              {activePatientTab === 'Laboratório' && (
                <section className="bg-white animate-in fade-in zoom-in-95 duration-200">
                  <div className="mb-4">
                    <h3 className="font-bold text-black text-[12px] uppercase tracking-wider flex items-center gap-2 mb-4"><Microscope size={18} className="text-indigo-600"/> Evolução Laboratorial Comparativa</h3>
                    <LabResultTable logs={selectedPatient.dailyLogs} onUpdateValue={async (logId, test, val) => {
                      const log = selectedPatient.dailyLogs.find(l => l.id === logId);
                      if (log) {
                        const newLabs = [...log.labs];
                        const idx = newLabs.findIndex(l => l.testName === test);
                        if (idx >= 0) newLabs[idx] = { ...newLabs[idx], value: val };
                        else newLabs.push({ testName: test, value: val, unit: '', referenceRange: '' });
                        
                        // Otimismo UI
                        setPatients(prev => prev.map(p => p.id === selectedPatient.id ? {
                          ...p, dailyLogs: p.dailyLogs.map(l => l.id === logId ? { ...l, labs: newLabs } : l)
                        } : p));

                        try {
                          await PatientService.upsertDailyLog(selectedPatient.id, { ...log, labs: newLabs } as any);
                          // Não chamamos loadPatients aqui para não resetar o estado da tabela durante edição
                        } catch (err) { 
                          alert(`Erro ao salvar exame: ${stringifyError(err)}`); 
                          loadPatients();
                        }
                      }
                    }} />
                  </div>
                </section>
              )}

              {activePatientTab === 'UTI' && selectedPatient.unit === 'UTI' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                   <section className="bg-slate-50 rounded-xl border border-medical-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-medical-700 text-white flex items-center justify-between">
                      <h3 className="font-bold text-[12px] uppercase tracking-widest flex items-center gap-2"><Gauge size={20}/> Terapia Intensiva (DVA & Ventilação)</h3>
                    </div>
                    <div className="p-4 space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="text-[11px] font-bold text-medical-800 uppercase flex items-center gap-2 border-b border-medical-100 pb-1"><Calculator size={16}/> Calculadora de DVA</h4>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {DRUG_PRESETS.map(preset => (
                              <button key={preset.id} onClick={() => handleDrugPresetClick(preset)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all border ${doseCalc.drug === preset.name ? 'bg-medical-600 text-white border-medical-700 shadow-sm' : 'bg-white text-medical-700 border-medical-200 hover:bg-medical-50'}`}>{preset.name}</button>
                            ))}
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4 shadow-sm">
                             <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2"><label className="text-[9px] font-bold text-slate-500 uppercase">Nome da Droga</label><input placeholder="Nome ou selecione..." className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-black uppercase" value={doseCalc.drug} onChange={e => setDoseCalc({...doseCalc, drug: e.target.value})}/></div>
                                <div><label className="text-[9px] font-bold text-slate-500 uppercase">Vazão (ml/h)</label><input type="number" className="w-full mt-1 border-2 border-medical-200 rounded-lg p-2 text-sm text-black font-bold focus:border-medical-500 outline-none" value={doseCalc.rate} onChange={e => setDoseCalc({...doseCalc, rate: e.target.value})}/></div>
                                <div className="flex flex-col justify-end"><button onClick={calculateDose} className="w-full bg-medical-700 text-white p-2 rounded-lg text-[11px] font-bold uppercase shadow-sm flex items-center justify-center gap-2"><FlaskConical size={14}/> Calcular</button></div>
                             </div>
                             {doseCalc.result && (
                               <div className="bg-medical-50 p-3 rounded-lg border border-medical-200 flex items-center justify-between">
                                 <div><p className="text-[9px] font-bold text-medical-800 uppercase">Dose Calculada:</p><p className="text-lg font-black text-medical-900">{doseCalc.result} <span className="text-xs font-bold">{doseCalc.calcType}</span></p></div>
                                 <button onClick={addDoseToText} className="bg-white text-medical-700 border border-medical-300 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase hover:bg-medical-600 hover:text-white transition-all">Inserir</button>
                               </div>
                             )}
                          </div>
                          <textarea className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-mono focus:border-medical-500 outline-none text-black leading-relaxed" rows={3} value={safeString(selectedPatient.vasoactiveDrugs)} onChange={e => updateICUParams({ vasoactiveDrugs: e.target.value })} placeholder="Doses atuais e observações..." />
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-[11px] font-bold text-blue-800 uppercase flex items-center gap-2 border-b border-blue-100 pb-1"><Wind size={16}/> Suporte Ventilatório</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Modo Principal</label>
                              <select className="w-full mt-1 bg-white border-2 border-blue-200 rounded-lg p-2.5 text-sm text-black font-black shadow-sm focus:border-blue-600 outline-none transition-all cursor-pointer" value={selectedPatient.ventilation?.mode || 'Espontânea'} onChange={e => handleVentilationModeChange(e.target.value as any)}>
                                <option value="Espontânea">Espontânea (AA)</option>
                                <option value="Cateter/CNAF">Cateter O2 / CNAF</option>
                                <option value="VNI">VNI (Máscara)</option>
                                <option value="VM">VM (Invasiva)</option>
                              </select>
                            </div>
                            {selectedPatient.ventilation?.mode === 'VM' && (
                              <>
                                <div className="col-span-2"><label className="text-[10px] font-bold text-slate-500 uppercase">Sub-modo (VCV, PCV, PSV)</label><input type="text" className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-sm uppercase text-black font-black" value={selectedPatient.ventilation?.subMode || ''} onChange={e => updateICUParams({ ventilation: { ...selectedPatient.ventilation, subMode: e.target.value } as Ventilation })} placeholder="EX: PCV"/></div>
                                <div><label className="text-[10px] font-bold text-slate-500 uppercase">FiO2 (%)</label><input type="number" className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-sm text-black font-bold" value={selectedPatient.ventilation?.fio2 || ''} onChange={e => updateICUParams({ ventilation: { ...selectedPatient.ventilation, fio2: e.target.value } as Ventilation })}/></div>
                                <div><label className="text-[10px] font-bold text-slate-500 uppercase">PEEP</label><input type="number" className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-sm text-black font-bold" value={selectedPatient.ventilation?.peep || ''} onChange={e => updateICUParams({ ventilation: { ...selectedPatient.ventilation, peep: e.target.value } as Ventilation })}/></div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                   </section>

                   <section className="bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-2 bg-orange-50 border-b flex items-center justify-between">
                      <h3 className="font-bold text-black text-[12px] uppercase tracking-wider flex items-center gap-2"><Calendar size={18} className="text-orange-600"/> Invasões e Dispositivos</h3>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-2">
                        <input placeholder="Ex: Cateter Venoso Central" className="flex-1 bg-white border rounded-lg p-2 text-sm text-black uppercase" value={newDeviceName} onChange={e => setNewDeviceName(e.target.value)}/>
                        <input type="date" className="bg-white border rounded-lg p-2 text-sm text-black" value={newDeviceDate} onChange={e => setNewDeviceDate(e.target.value)}/>
                        <button onClick={() => { if (!newDeviceName) return; const newDev = { id: Date.now().toString(), name: newDeviceName, insertionDate: newDeviceDate }; updatePatientList('devices_list', newDev, 'add'); setNewDeviceName(''); }} className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold text-[11px] uppercase shadow-md flex items-center justify-center gap-2"><PlusCircle size={16}/> Adicionar</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {selectedPatient.devices_list?.map((dev, i) => (
                          <div key={dev.id} className="bg-white p-3 border border-slate-200 rounded-xl flex items-center justify-between group shadow-sm">
                             <div className="flex-1 min-w-0">
                                  <p className="text-[12px] font-bold text-slate-800 truncate uppercase">{safeString(dev.name)}</p>
                                  <p className="text-[10px] text-slate-500 font-bold uppercase">Desde: {new Date(dev.insertionDate).toLocaleDateString('pt-BR')}</p>
                             </div>
                             <button onClick={() => updatePatientList('devices_list', null, 'remove', i)} className="p-1.5 text-slate-300 hover:text-red-600"><Trash2 size={14}/></button>
                          </div>
                        ))}
                      </div>
                    </div>
                   </section>
                </div>
              )}

              {activePatientTab === 'Evoluções' && (
                <section className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
                  <h3 className="text-[12px] font-bold text-slate-700 uppercase flex items-center gap-2 ml-1 tracking-[0.2em] mb-4"><History size={20} className="text-medical-600"/> Histórico Cronológico de Evoluções</h3>
                  {[...selectedPatient.dailyLogs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
                    <div key={log.id} className="bg-white rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-medical-600 overflow-hidden">
                      <div className="px-4 py-3 bg-slate-50 flex justify-between items-center cursor-pointer" onClick={() => toggleLogSection(log.id)}>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-black text-[12px] uppercase">{new Date(log.date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', weekday: 'short'})}</span>
                          {collapsedLogs[log.id] && <span className="text-[11px] text-slate-500 truncate italic">"{safeString(log.notes).substring(0, 80)}..."</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => { e.stopPropagation(); setEditingLog(log); setShowAddLogModal(true); }} className="p-2 text-slate-500 hover:text-medical-600"><Pencil size={18}/></button>
                          <button onClick={(e) => { e.stopPropagation(); if(window.confirm('Excluir evolução?')) { PatientService.deleteDailyLog(log.id).then(() => loadPatients()); } }} className="p-2 text-slate-500 hover:text-red-600"><Trash2 size={18}/></button>
                          {collapsedLogs[log.id] ? <ChevronDown size={20}/> : <ChevronUp size={20}/>}
                        </div>
                      </div>
                      {!collapsedLogs[log.id] && (
                        <div className="p-4">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                             <p className="text-sm text-black whitespace-pre-wrap leading-relaxed uppercase">{safeString(log.notes) || 'Sem registro.'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </section>
              )}

              {activePatientTab === 'Anexos' && (
                <section className="bg-white animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-black text-[12px] uppercase tracking-wider flex items-center gap-2"><ImageIcon size={18} className="text-medical-600"/> Anexos e Fotos Clínicas</h3>
                    <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-bold uppercase text-medical-600 bg-white border border-medical-200 px-4 py-2 rounded-lg hover:bg-medical-50 transition-all shadow-sm flex items-center gap-2"><Upload size={14}/> Fazer Upload</button>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx" />
                  
                  {activeAttachments.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {activeAttachments.map((att) => (
                        <div key={att.id} className="group relative aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => setMaximizedAttachment(att)}>
                          {att.type === 'image' ? (
                            <img src={att.url} alt={att.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center gap-2">
                              <FileText size={32} className="text-slate-400" />
                              <span className="text-[10px] font-bold text-slate-600 truncate w-full uppercase px-2">{att.name}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                             <div className="p-2 bg-white/20 rounded-full hover:bg-white/40 text-white"><Maximize2 size={20}/></div>
                             <button onClick={(e) => handleRemoveAttachment(e, att.id)} className="p-2 bg-red-600/40 rounded-full hover:bg-red-600 text-white transition-colors" title="Excluir Anexo"><Trash2 size={20}/></button>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/60 text-white text-[8px] font-black truncate uppercase text-center">{att.name}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center gap-3 text-slate-300">
                      <ImageIcon size={48} className="opacity-30" />
                      <p className="text-[10px] uppercase font-black tracking-widest italic">Nenhum anexo registrado neste prontuário</p>
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 opacity-30 uppercase font-black text-base tracking-[0.3em] bg-slate-50 text-center px-4">
             <Activity size={80} className="mb-4 text-medical-200" />
             Selecione um paciente para monitoramento
          </div>
        )}

        {showAddPatientModal && (
          <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 text-black animate-in zoom-in-95 duration-200">
              <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
                <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2"><UserPlus size={18} className="text-medical-400"/> {editingPatientId ? 'Editar' : 'Novo'} Cadastro</h3>
                <button onClick={() => setShowAddPatientModal(false)} className="p-1 hover:bg-slate-700 rounded-lg transition-colors"><X size={24}/></button>
              </div>
              <form onSubmit={handleSavePatient} className="p-6 space-y-5">
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-600 uppercase">Nome Completo</label><input required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-base outline-none text-black uppercase" value={newPatientData.name} onChange={e => setNewPatientData({...newPatientData, name: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-xs font-bold text-slate-600 uppercase">Leito</label><input required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-base text-black font-bold uppercase" value={newPatientData.bedNumber} onChange={e => setNewPatientData({...newPatientData, bedNumber: e.target.value})} /></div>
                  <div className="space-y-1.5"><label className="text-xs font-bold text-slate-600 uppercase">Idade</label><input required type="number" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-base text-black" value={newPatientData.age || ''} onChange={e => setNewPatientData({...newPatientData, age: parseInt(e.target.value) || 0})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-xs font-bold text-slate-600 uppercase">Unidade</label><select className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-base text-black font-bold" value={newPatientData.unit} onChange={e => setNewPatientData({...newPatientData, unit: e.target.value as any})}><option value="UTI">UTI</option><option value="Enfermaria">Enfermaria</option></select></div>
                  <div className="space-y-1.5"><label className="text-xs font-bold text-slate-600 uppercase">Peso Est. (kg)</label><input type="number" step="0.1" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-base text-black" value={newPatientData.estimatedWeight || ''} onChange={e => setNewPatientData({...newPatientData, estimatedWeight: parseFloat(e.target.value) || 0})} /></div>
                </div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-600 uppercase">Data de Admissão</label><input required type="date" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-base text-black" value={newPatientData.admissionDate} onChange={e => setNewPatientData({...newPatientData, admissionDate: e.target.value})} /></div>
                <button type="submit" disabled={isLoading} className={`w-full ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-medical-600 hover:bg-medical-700 shadow-lg'} text-white p-4 rounded-xl font-bold text-base uppercase transition-all`}>
                  {isLoading ? 'Aguarde...' : 'Salvar Cadastro'}
                </button>
              </form>
            </div>
          </div>
        )}

        {showTransferModal && selectedPatient && (
          <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 space-y-5 text-center text-black">
              <h3 className="font-bold text-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 mb-4"><ArrowRightLeft size={20} className="text-medical-600"/> Mudar Status/Setor</h3>
              <div className="grid gap-2.5">
                {['UTI', 'Enfermaria', 'Finalizados'].map(t => (
                  <button key={t} onClick={() => setTransferTarget(t)} className={`p-3 border-2 rounded-xl text-center text-sm font-bold transition-all ${transferTarget === t ? 'border-medical-600 bg-medical-50 text-medical-800 shadow-md' : 'border-slate-100 text-slate-500'}`}>{t}</button>
                ))}
              </div>
              <button onClick={handleConfirmTransfer} className="w-full bg-medical-600 text-white p-4 rounded-xl font-bold uppercase shadow-lg hover:bg-medical-700 transition-colors">Confirmar</button>
              <button onClick={() => setShowTransferModal(false)} className="text-[10px] text-slate-400 font-bold uppercase py-2">Cancelar</button>
            </div>
          </div>
        )}

        {showFinalizedListModal && (
          <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 text-black">
              <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
                <h3 className="font-bold text-sm uppercase tracking-widest flex items-center gap-3"><ArchiveRestore size={22} className="text-medical-400"/> Pacientes Finalizados</h3>
                <button onClick={() => setShowFinalizedListModal(false)}><X size={28}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {finalizedPatients.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {finalizedPatients.map(p => (
                      <div key={p.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-black uppercase text-[12px] leading-tight">{safeString(p.name)}</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Leito: {safeString(p.bedNumber)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => PatientService.updatePatient(p.id, { status: 'active', unit: 'UTI' }).then(() => loadPatients())} className="flex-1 bg-medical-600 text-white text-[9px] font-black p-2 rounded-lg hover:bg-medical-700 uppercase transition-all">Reabrir UTI</button>
                          <button onClick={() => PatientService.updatePatient(p.id, { status: 'active', unit: 'Enfermaria' }).then(() => loadPatients())} className="flex-1 border border-medical-600 text-medical-600 text-[9px] font-black p-2 rounded-lg hover:bg-medical-50 uppercase transition-all">Reabrir Enf.</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 text-slate-300 uppercase font-black tracking-widest text-sm italic">Histórico de finalizados vazio</div>
                )}
              </div>
            </div>
          </div>
        )}

        {showAddLogModal && (
          <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-2 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[96vh] overflow-hidden flex flex-col border border-slate-200 text-black">
              <div className="bg-slate-900 p-3 text-white flex justify-between items-center"><h3 className="font-bold text-sm uppercase flex items-center gap-3 px-4 tracking-widest"><ClipboardList size={24} className="text-medical-500"/> Registro Diário</h3><button onClick={() => setShowAddLogModal(false)} className="p-2 rounded-xl"><X size={32}/></button></div>
              <div className="p-6 overflow-y-auto bg-white"><DailyLogForm initialData={editingLog || undefined} initialPrescriptions={selectedPatient?.medicalPrescription?.split('\n').filter(p => p.trim())} onSave={handleSaveLog} onCancel={() => setShowAddLogModal(false)} patientUnit={selectedPatient?.unit} /></div>
            </div>
          </div>
        )}

        {showPrintPreview && selectedPatient && <PatientPrintView patient={selectedPatient} onClose={() => setShowPrintPreview(false)} />}
        {showPlantaoPrint && <PatientListPrintView patients={filteredPatients} unit={activeTab} onClose={() => setShowPlantaoPrint(false)} />}
        
        {maximizedAttachment && (
          <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
            <button onClick={() => setMaximizedAttachment(null)} className="absolute top-6 right-6 text-white hover:text-red-500 transition-colors bg-white/10 p-2 rounded-full z-10"><X size={32}/></button>
            <div className="w-full max-w-5xl max-h-full flex flex-col items-center gap-4">
              {maximizedAttachment.type === 'image' ? (
                <img src={maximizedAttachment.url} alt={maximizedAttachment.name} className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-lg border border-white/10" />
              ) : (
                <div className="bg-white p-12 rounded-3xl flex flex-col items-center gap-6 shadow-2xl">
                   <FileText size={80} className="text-medical-600" />
                   <p className="text-lg font-black uppercase text-slate-800">{maximizedAttachment.name}</p>
                   <a href={maximizedAttachment.url} download={maximizedAttachment.name} className="bg-medical-600 text-white px-8 py-3 rounded-xl font-bold uppercase shadow-xl flex items-center gap-2"><Download size={20}/> Baixar Arquivo</a>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
