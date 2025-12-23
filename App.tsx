
import React, { useState, useEffect } from 'react';
import { 
  Activity, BrainCircuit, PlusCircle, ChevronDown, ChevronUp, Menu, X, 
  ClipboardList, History, Pencil, Check, ArrowUp, ArrowDown, Trash2, 
  UserPlus, Printer, ArrowRightLeft, Pill, Microscope, HeartPulse, LogOut, Droplets, Wind, Gauge, Calculator, Calendar
} from 'lucide-react';
import { Patient, DailyLog, Device, Ventilation } from './types';
import DailyLogForm from './components/DailyLogForm';
import LabResultTable from './components/LabResultTable';
import { PatientPrintView, PatientListPrintView } from './components/PrintViews';
import * as PatientService from './services/patientService';

const safeString = (val: any): string => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return '';
  return String(val);
};

// Helper para converter erro para string legível e evitar [object Object]
const stringifyError = (err: any): string => {
  if (!err) return 'Erro desconhecido';
  if (typeof err === 'string') return err;
  if (err.message) return err.message;
  if (err.details) return err.details;
  try {
    return JSON.stringify(err);
  } catch (e) {
    return String(err);
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

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'UTI' | 'Enfermaria' | 'Finalizados'>('UTI');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    'dx': false, 'icu': false, 'antecedents': false, 'rx': false, 'labs': false, 'history': false
  });
  const [collapsedLogs, setCollapsedLogs] = useState<Record<string, boolean>>({});

  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showPlantaoPrint, setShowPlantaoPrint] = useState(false);

  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [newPatientData, setNewPatientData] = useState(INITIAL_NEW_PATIENT_STATE);
  const [editingPrescription, setEditingPrescription] = useState(false);
  const [tempPrescription, setTempPrescription] = useState('');
  
  const [newDiagnosis, setNewDiagnosis] = useState('');
  const [editingDxIndex, setEditingDxIndex] = useState<number | null>(null);
  const [editingDxValue, setEditingDxValue] = useState('');
  const [newAntecedent, setNewAntecedent] = useState('');
  const [newHomeMed, setNewHomeMed] = useState('');
  const [transferTarget, setTransferTarget] = useState<string>('UTI');

  // ICU States
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceDate, setNewDeviceDate] = useState(new Date().toISOString().split('T')[0]);
  const [doseCalc, setDoseCalc] = useState({ drug: '', mg: '', ml: '', rate: '', result: '' });

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
  const filteredPatients = (patients || []).filter(p => activeTab === 'Finalizados' ? p.status === 'completed' : p.unit === activeTab && p.status === 'active');

  useEffect(() => {
    if (selectedPatient) setTempPrescription(safeString(selectedPatient.medicalPrescription));
    setEditingPrescription(false);
  }, [selectedPatientId, selectedPatient?.medicalPrescription]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === '223209**') { setIsAuthenticated(true); }
    else { alert('Senha incorreta.'); setPasswordInput(''); }
  };

  const toggleSection = (id: string) => setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleLogSection = (id: string) => setCollapsedLogs(prev => ({ ...prev, [id]: !prev[id] }));

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const errorMsg = stringifyError(err);
      console.error('Save Patient Error Detail:', err);
      alert(`Ops! Não foi possível salvar o paciente.\n\nERRO: ${errorMsg}\n\nNota: Se for erro de 'column not found', você precisa adicionar as novas colunas à sua tabela 'patients' no Supabase.`);
    }
  };

  const handleSaveLog = async (logData: Omit<DailyLog, 'id'>) => {
    if (!selectedPatientId) return;
    try {
      await PatientService.upsertDailyLog(selectedPatientId, { id: editingLog?.id || 'new', ...logData } as any);
      await loadPatients(); setShowAddLogModal(false); setEditingLog(null);
    } catch (err: any) { 
      alert(`Erro ao salvar registro clínico: ${stringifyError(err)}`); 
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!selectedPatientId || !window.confirm('Excluir este registro clínico?')) return;
    try { await PatientService.deleteDailyLog(logId); await loadPatients(); } catch (err) { alert(`Erro ao excluir: ${stringifyError(err)}`); }
  };

  const updatePatientList = async (field: any, value: any, action: 'add' | 'remove' | 'edit' | 'reorder', index?: number) => {
    if (!selectedPatientId || !selectedPatient) return;
    let newList = [...(selectedPatient[field] || [])];
    if (action === 'add' && value) newList.push(value);
    else if (action === 'remove' && index !== undefined) newList.splice(index, 1);
    try {
      await PatientService.updatePatient(selectedPatientId, { [field]: newList });
      await loadPatients();
    } catch (err) {
      alert(`Erro ao atualizar lista: ${stringifyError(err)}`);
    }
  };

  const updateICUParams = async (updates: Partial<Patient>) => {
    if (!selectedPatientId) return;
    try { 
      await PatientService.updatePatient(selectedPatientId, updates); 
      await loadPatients(); 
    } catch (err) { 
      alert(`Erro ao atualizar parâmetros: ${stringifyError(err)}`); 
    }
  };

  const calculateDose = () => {
    if (!selectedPatient || !doseCalc.mg || !doseCalc.ml || !doseCalc.rate) return;
    const mg = parseFloat(doseCalc.mg);
    const ml = parseFloat(doseCalc.ml);
    const rate = parseFloat(doseCalc.rate);
    const weight = selectedPatient.estimatedWeight || 70;
    const result = ((mg / ml) * 1000 * rate) / (weight * 60);
    setDoseCalc({ ...doseCalc, result: result.toFixed(2) });
  };

  const totalFluidBalance = selectedPatient?.dailyLogs.reduce((acc, log) => acc + (log.fluidBalance?.net || 0), 0) || 0;

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 p-4 font-sans text-black">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-sm text-center border border-slate-700">
          <Activity className="text-medical-600 mb-4 mx-auto" size={48} />
          <h1 className="text-xl font-bold mb-6 tracking-tight uppercase">CardioEDAD</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" autoFocus placeholder="Senha de Acesso" className="w-full border-2 border-slate-200 p-3 rounded-xl text-center outline-none focus:border-medical-500 font-medium text-black" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
            <button type="submit" className="w-full bg-medical-600 text-white p-3 rounded-xl font-bold shadow-lg hover:bg-medical-700 transition-all">Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans text-[13px] lg:text-[15px] text-black">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 lg:static transition-all duration-300 transform ${isSidebarOpen ? 'translate-x-0 w-64 lg:w-72' : '-translate-x-full lg:translate-x-0 lg:w-0'} bg-slate-900 text-white flex flex-col shadow-xl border-r border-slate-700`}>
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2"><Activity className="text-medical-400" size={20} /><h1 className="font-bold text-base lg:text-lg tracking-tight">CardioEDAD</h1></div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white"><X size={24}/></button>
        </div>
        
        <div className="flex border-b border-slate-700 bg-slate-800">
          {['UTI', 'Enfermaria', 'Finalizados'].map(t => (
            <button 
              key={t} 
              onClick={() => setActiveTab(t as any)} 
              className={`flex-1 py-3 text-[7px] lg:text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === t ? 'bg-medical-600 text-white border-b-2 border-white' : 'text-slate-400 hover:text-white'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-3 space-y-2">
          <button onClick={() => { setEditingPatientId(null); setNewPatientData(INITIAL_NEW_PATIENT_STATE); setShowAddPatientModal(true); }} className="w-full flex items-center justify-center gap-2 bg-slate-700 p-2.5 rounded-xl text-[12px] font-bold border border-slate-600 hover:bg-slate-600 transition-all text-white shadow-sm uppercase"><UserPlus size={18} /> Novo Paciente</button>
          <button onClick={() => setShowPlantaoPrint(true)} className="w-full flex items-center justify-center gap-2 bg-slate-800 p-2.5 rounded-xl text-[11px] font-bold border border-slate-700 hover:bg-slate-700 transition-all text-slate-300 uppercase"><Printer size={16} /> Plantão</button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {isLoading && <div className="p-4 text-center text-slate-500 animate-pulse text-[10px] uppercase font-bold">Sincronizando...</div>}
          {!isLoading && filteredPatients.length === 0 && <div className="p-8 text-center text-slate-600 text-[9px] uppercase opacity-50 font-bold">Nenhum Registro</div>}
          {filteredPatients.map(p => (
            <div key={p.id} onClick={() => { setSelectedPatientId(p.id); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} className={`p-3 rounded-xl cursor-pointer transition-all border ${selectedPatientId === p.id ? 'bg-medical-700 border-white text-white shadow-md' : 'bg-transparent border-transparent hover:bg-slate-800'}`}>
              <div className="flex justify-between items-center">
                <span className="truncate pr-2 font-medium uppercase text-[11px]">{safeString(p.name)}</span>
                <span className="text-[9px] bg-black/40 px-2 py-0.5 rounded uppercase shrink-0 font-bold">{safeString(p.bedNumber)}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-slate-700">
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-[12px] text-slate-400 hover:text-white transition-colors py-2 px-1 rounded hover:bg-slate-800"><LogOut size={16}/> Sair do Sistema</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        <header className="bg-slate-50 border-b px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm z-20">
          <div className="flex items-center gap-4 w-full md:w-auto">
            {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white rounded-lg border border-slate-200"><Menu size={20}/></button>}
            {selectedPatient && (
              <div className="overflow-hidden">
                <h2 className="text-base lg:text-lg font-bold text-black leading-tight truncate uppercase">{safeString(selectedPatient.name)}</h2>
                <div className="flex flex-wrap gap-x-4 text-[11px] font-medium text-slate-700 mt-1 uppercase">
                  <span className="text-medical-700 font-bold">LEITO: {safeString(selectedPatient.bedNumber)}</span>
                  <span>IDADE: {selectedPatient.age} ANOS</span>
                  <button onClick={() => { setEditingPatientId(selectedPatient.id); setNewPatientData({...selectedPatient}); setShowAddPatientModal(true); }} className="text-medical-600 underline font-bold uppercase text-[10px]">Alterar</button>
                </div>
              </div>
            )}
          </div>
          {selectedPatient && (
            <div className="flex gap-2 w-full md:w-auto">
              <button onClick={() => setShowPrintPreview(true)} className="p-2 border border-slate-300 rounded-lg bg-white"><Printer size={18} /></button>
              <button onClick={() => setShowTransferModal(true)} className="flex-1 md:flex-none border border-slate-300 bg-white px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-900 uppercase">Status</button>
              <button onClick={() => { setEditingLog(null); setShowAddLogModal(true); }} className="flex-1 md:flex-none bg-medical-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-bold shadow-md uppercase">Evolução</button>
            </div>
          )}
        </header>

        {selectedPatient ? (
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 bg-white">
            {/* Seção UTI (Condicional) */}
            {selectedPatient.unit === 'UTI' && (
              <section className="bg-slate-50 rounded-xl border border-medical-200 shadow-md overflow-hidden">
                <div className="px-4 py-3 bg-medical-700 text-white flex items-center justify-between cursor-pointer" onClick={() => toggleSection('icu')}>
                  <h3 className="font-bold text-[12px] uppercase tracking-widest flex items-center gap-2"><Gauge size={20}/> Parâmetros de Terapia Intensiva</h3>
                  {collapsedSections['icu'] ? <ChevronDown size={18}/> : <ChevronUp size={18}/>}
                </div>
                {!collapsedSections['icu'] && (
                  <div className="p-4 space-y-6">
                    {/* Fluid Balance Total */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <Droplets className="text-blue-500" size={24}/>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Balanço Hídrico Acumulado</p>
                          <p className={`text-xl font-black ${totalFluidBalance > 0 ? 'text-blue-600' : totalFluidBalance < 0 ? 'text-red-600' : 'text-slate-700'}`}>
                            {totalFluidBalance > 0 ? '+' : ''}{totalFluidBalance} ml
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Dias Registrados</p>
                        <p className="text-base font-bold text-slate-800">{selectedPatient.dailyLogs.filter(l => l.fluidBalance).length}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* DVA & Calculator */}
                      <div className="space-y-4">
                        <h4 className="text-[11px] font-bold text-medical-800 uppercase flex items-center gap-2 border-b border-medical-100 pb-1"><Calculator size={16}/> Drogas Vasoativas & Sedação</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Infusões em Curso</label>
                            <textarea 
                              className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-medical-500 outline-none text-black"
                              rows={3}
                              placeholder="Noradrenalina: 0.2 mcg/kg/min..."
                              value={safeString(selectedPatient.vasoactiveDrugs)}
                              onChange={e => updateICUParams({ vasoactiveDrugs: e.target.value })}
                            />
                          </div>
                          {/* Calculator Helper */}
                          <div className="bg-medical-50 p-3 rounded-lg border border-medical-100 space-y-2">
                            <p className="text-[9px] font-bold text-medical-700 uppercase">Calculadora de Dose (mcg/kg/min)</p>
                            <div className="grid grid-cols-3 gap-2">
                              <input placeholder="mg" className="p-1 border text-xs text-black" type="number" value={doseCalc.mg} onChange={e => setDoseCalc({...doseCalc, mg: e.target.value})}/>
                              <input placeholder="ml" className="p-1 border text-xs text-black" type="number" value={doseCalc.ml} onChange={e => setDoseCalc({...doseCalc, ml: e.target.value})}/>
                              <input placeholder="ml/h" className="p-1 border text-xs text-black" type="number" value={doseCalc.rate} onChange={e => setDoseCalc({...doseCalc, rate: e.target.value})}/>
                            </div>
                            <div className="flex items-center justify-between">
                              <button onClick={calculateDose} className="bg-medical-600 text-white px-3 py-1 rounded text-[10px] font-bold uppercase">Calcular</button>
                              {doseCalc.result && <p className="font-bold text-medical-800">{doseCalc.result} mcg/kg/min</p>}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Ventilation Mechanical */}
                      <div className="space-y-4">
                        <h4 className="text-[11px] font-bold text-blue-800 uppercase flex items-center gap-2 border-b border-blue-100 pb-1"><Wind size={16}/> Suporte Ventilatório</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Modo / Interface</label>
                            <select 
                              className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-sm text-black"
                              value={selectedPatient.ventilation?.mode || 'Espontânea'}
                              onChange={e => updateICUParams({ ventilation: { ...selectedPatient.ventilation, mode: e.target.value as any } as Ventilation })}
                            >
                              <option value="Espontânea">Espontânea (AA)</option>
                              <option value="Cateter/CNAF">Cateter O2 / CNAF</option>
                              <option value="VNI">VNI (Mascara)</option>
                              <option value="VM">VM (Invasiva)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">FiO2 (%)</label>
                            <input type="number" className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-sm text-black" value={selectedPatient.ventilation?.fio2 || ''} onChange={e => updateICUParams({ ventilation: { ...selectedPatient.ventilation, fio2: e.target.value } as Ventilation })}/>
                          </div>
                          {selectedPatient.ventilation?.mode === 'Cateter/CNAF' ? (
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Fluxo (L/min)</label>
                              <input type="number" className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-sm text-black" value={selectedPatient.ventilation?.flow || ''} onChange={e => updateICUParams({ ventilation: { ...selectedPatient.ventilation, flow: e.target.value } as Ventilation })}/>
                            </div>
                          ) : (
                            <>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">PEEP / EPAP</label>
                                <input type="number" className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-sm text-black" value={selectedPatient.ventilation?.peep || ''} onChange={e => updateICUParams({ ventilation: { ...selectedPatient.ventilation, peep: e.target.value } as Ventilation })}/>
                              </div>
                              {selectedPatient.ventilation?.mode === 'VM' && (
                                <>
                                  <div className="col-span-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Sub-Modo (VCV/PCV/PSV)</label>
                                    <input type="text" className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-sm uppercase text-black" value={selectedPatient.ventilation?.subMode || ''} onChange={e => updateICUParams({ ventilation: { ...selectedPatient.ventilation, subMode: e.target.value } as Ventilation })}/>
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Pressão Suporte/Insp</label>
                                    <input type="number" className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-sm text-black" value={selectedPatient.ventilation?.pressure || ''} onChange={e => updateICUParams({ ventilation: { ...selectedPatient.ventilation, pressure: e.target.value } as Ventilation })}/>
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Volume Corrente</label>
                                    <input type="number" className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-sm text-black" value={selectedPatient.ventilation?.volume || ''} onChange={e => updateICUParams({ ventilation: { ...selectedPatient.ventilation, volume: e.target.value } as Ventilation })}/>
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Devices Management */}
                      <div className="col-span-1 lg:col-span-2 space-y-3">
                        <h4 className="text-[11px] font-bold text-orange-800 uppercase flex items-center gap-2 border-b border-orange-100 pb-1"><Calendar size={16}/> Dispositivos & Invasões</h4>
                        <div className="flex gap-2">
                          <input placeholder="Ex: Cateter Venoso Central" className="flex-1 bg-white border rounded-lg p-2 text-sm text-black" value={newDeviceName} onChange={e => setNewDeviceName(e.target.value)}/>
                          <input type="date" className="bg-white border rounded-lg p-2 text-sm text-black" value={newDeviceDate} onChange={e => setNewDeviceDate(e.target.value)}/>
                          <button onClick={() => { updatePatientList('devices_list', { id: Date.now().toString(), name: newDeviceName, insertionDate: newDeviceDate }, 'add'); setNewDeviceName(''); }} className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-[11px] uppercase shadow-sm">Adicionar</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {selectedPatient.devices_list?.map((dev, i) => (
                            <div key={dev.id} className="bg-white p-2 border border-orange-100 rounded-lg flex items-center justify-between shadow-sm">
                              <div>
                                <p className="text-[11px] font-bold text-slate-800">{safeString(dev.name)}</p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase">Inserção: {new Date(dev.insertionDate).toLocaleDateString('pt-BR')}</p>
                              </div>
                              <button onClick={() => updatePatientList('devices_list', null, 'remove', i)} className="text-slate-300 hover:text-red-600"><X size={16}/></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Hipóteses Diagnósticas */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-2 bg-slate-100 border-b flex items-center justify-between cursor-pointer" onClick={() => toggleSection('dx')}>
                <h3 className="font-bold text-black text-[12px] uppercase tracking-wider flex items-center gap-2"><BrainCircuit size={18} className="text-medical-600"/> Hipóteses Diagnósticas</h3>
                {collapsedSections['dx'] ? <ChevronDown size={18}/> : <ChevronUp size={18}/>}
              </div>
              {!collapsedSections['dx'] && (
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
              )}
            </section>

            {/* Antecedentes */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-2 bg-slate-100 border-b flex items-center justify-between cursor-pointer" onClick={() => toggleSection('antecedents')}>
                <h3 className="font-bold text-black text-[12px] uppercase tracking-wider flex items-center gap-2"><HeartPulse size={18} className="text-red-600"/> Antecedentes & Medicações Habituais</h3>
                {collapsedSections['antecedents'] ? <ChevronDown size={18}/> : <ChevronUp size={18}/>}
              </div>
              {!collapsedSections['antecedents'] && (
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
              )}
            </section>

            {/* Prescrição */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-2 bg-slate-100 border-b flex items-center justify-between cursor-pointer" onClick={() => toggleSection('rx')}>
                <h3 className="font-bold text-black text-[12px] uppercase tracking-wider flex items-center gap-2"><Pill size={18} className="text-orange-600"/> Prescrição Vigente</h3>
                <button onClick={(e) => { e.stopPropagation(); editingPrescription ? (updateICUParams({ medicalPrescription: tempPrescription }), setEditingPrescription(false)) : setEditingPrescription(true) }} className="text-[10px] font-bold uppercase text-medical-600 border border-medical-200 px-3 py-1 rounded-lg bg-white shadow-sm">{editingPrescription ? 'SALVAR' : 'EDITAR'}</button>
              </div>
              {!collapsedSections['rx'] && (
                <div className="p-4">
                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 shadow-inner">
                    {editingPrescription ? (
                      <textarea className="w-full bg-white border border-slate-200 p-4 rounded-lg text-sm font-mono h-48 outline-none text-black leading-relaxed" value={tempPrescription} onChange={e => setTempPrescription(e.target.value)} placeholder="Edite a prescrição..." />
                    ) : (
                      <div className="text-[13px] text-black whitespace-pre-line leading-relaxed font-mono uppercase">
                        {safeString(selectedPatient.medicalPrescription) || 'Nenhuma prescrição registrada.'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Evolução Laboratorial */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-2 bg-slate-100 border-b flex items-center justify-between cursor-pointer" onClick={() => toggleSection('labs')}>
                <h3 className="font-bold text-black text-[12px] uppercase tracking-wider flex items-center gap-2"><Microscope size={18} className="text-indigo-600"/> Evolução Laboratorial</h3>
                {collapsedSections['labs'] ? <ChevronDown size={18}/> : <ChevronUp size={18}/>}
              </div>
              {!collapsedSections['labs'] && (
                <div className="p-2 overflow-x-auto">
                  <LabResultTable logs={selectedPatient.dailyLogs} onUpdateValue={async (logId, test, val) => {
                    const log = selectedPatient.dailyLogs.find(l => l.id === logId);
                    if (log) {
                      const newLabs = [...log.labs];
                      const idx = newLabs.findIndex(l => l.testName === test);
                      if (idx >= 0) newLabs[idx] = { ...newLabs[idx], value: val };
                      else newLabs.push({ testName: test, value: val, unit: '', referenceRange: '' });
                      try {
                        await PatientService.upsertDailyLog(selectedPatient.id, { ...log, labs: newLabs } as any);
                        await loadPatients();
                      } catch (err) {
                        alert(`Erro ao atualizar exames: ${stringifyError(err)}`);
                      }
                    }
                  }} />
                </div>
              )}
            </section>
            
            {/* Histórico */}
            <section className="space-y-3">
              <h3 className="text-[12px] font-bold text-slate-700 uppercase flex items-center gap-2 ml-1 tracking-[0.2em]"><History size={20} className="text-medical-600"/> Histórico de Evoluções</h3>
              {[...selectedPatient.dailyLogs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
                <div key={log.id} className="bg-white rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-medical-600 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 flex justify-between items-center cursor-pointer" onClick={() => toggleLogSection(log.id)}>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-black text-[12px] uppercase">{new Date(log.date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', weekday: 'short'})}</span>
                      {collapsedLogs[log.id] && <span className="text-[11px] text-slate-500 truncate italic">"{safeString(log.notes).substring(0, 80)}..."</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); setEditingLog(log); setShowAddLogModal(true); }} className="p-2 text-slate-500 hover:text-medical-600"><Pencil size={18}/></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteLog(log.id); }} className="p-2 text-slate-500 hover:text-red-600"><Trash2 size={18}/></button>
                      {collapsedLogs[log.id] ? <ChevronDown size={20}/> : <ChevronUp size={20}/>}
                    </div>
                  </div>
                  {!collapsedLogs[log.id] && (
                    <div className="p-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                           <div className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Temp</div>
                           <div className="font-bold text-black text-xs">{safeString(log.vitalSigns.temperature)}°C</div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                           <div className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">FC</div>
                           <div className="font-bold text-black text-xs">{safeString(log.vitalSigns.heartRate)} bpm</div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                           <div className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">PA</div>
                           <div className="font-bold text-black text-xs">{safeString(log.vitalSigns.bloodPressureSys)}/{safeString(log.vitalSigns.bloodPressureDia)}</div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                           <div className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">SatO2</div>
                           <div className="font-bold text-black text-xs">{safeString(log.vitalSigns.oxygenSaturation)}%</div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                           <div className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Dextro</div>
                           <div className="font-bold text-black text-xs">{safeString(log.vitalSigns.capillaryBloodGlucose) || '-'}</div>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-inner">
                         <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-[0.2em]">Nota Clínica:</h4>
                         <p className="text-sm text-black whitespace-pre-wrap leading-relaxed">{safeString(log.notes) || 'Sem registro.'}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </section>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 opacity-30 uppercase font-black text-base tracking-[0.3em] bg-slate-50 text-center px-4">
             <Activity size={80} className="mb-4 text-medical-200" />
             Selecione um paciente
          </div>
        )}

        {/* Modais */}
        {showAddPatientModal && (
          <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
              <div className="bg-slate-800 p-4 text-white flex justify-between items-center"><h3 className="font-bold text-sm uppercase tracking-wider">{editingPatientId ? 'Editar' : 'Novo'} Cadastro</h3><button onClick={() => setShowAddPatientModal(false)} className="p-1"><X size={28}/></button></div>
              <form onSubmit={handleSavePatient} className="p-6 space-y-5">
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-600 uppercase">Nome Completo</label><input required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-base outline-none text-black uppercase" value={newPatientData.name} onChange={e => setNewPatientData({...newPatientData, name: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-xs font-bold text-slate-600 uppercase">Leito</label><input required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-base text-black" value={newPatientData.bedNumber} onChange={e => setNewPatientData({...newPatientData, bedNumber: e.target.value})} /></div>
                  <div className="space-y-1.5"><label className="text-xs font-bold text-slate-600 uppercase">Idade</label><input required type="number" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-base text-black" value={newPatientData.age || ''} onChange={e => setNewPatientData({...newPatientData, age: parseInt(e.target.value) || 0})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-xs font-bold text-slate-600 uppercase">Unidade</label><select className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-base text-black" value={newPatientData.unit} onChange={e => setNewPatientData({...newPatientData, unit: e.target.value as any})}><option value="UTI">UTI</option><option value="Enfermaria">Enfermaria</option></select></div>
                  <div className="space-y-1.5"><label className="text-xs font-bold text-slate-600 uppercase">Peso Est. (kg)</label><input type="number" step="0.1" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-base text-black" value={newPatientData.estimatedWeight || ''} onChange={e => setNewPatientData({...newPatientData, estimatedWeight: parseFloat(e.target.value) || 0})} /></div>
                </div>
                <button type="submit" className="w-full bg-medical-600 text-white p-4 rounded-xl font-bold text-base uppercase shadow-lg">Salvar Cadastro</button>
              </form>
            </div>
          </div>
        )}

        {showAddLogModal && (
          <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-2 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[96vh] overflow-hidden flex flex-col border border-slate-200">
              <div className="bg-slate-900 p-3 text-white flex justify-between items-center"><h3 className="font-bold text-sm uppercase flex items-center gap-3 px-4 tracking-widest"><ClipboardList size={24} className="text-medical-500"/> Registro Clínico Diário</h3><button onClick={() => setShowAddLogModal(false)} className="p-2 rounded-xl transition-colors"><X size={32}/></button></div>
              <div className="p-6 overflow-y-auto bg-white"><DailyLogForm initialData={editingLog || undefined} initialPrescriptions={selectedPatient?.medicalPrescription?.split('\n').filter(p => p.trim())} onSave={handleSaveLog} onCancel={() => setShowAddLogModal(false)} patientUnit={selectedPatient?.unit} /></div>
            </div>
          </div>
        )}

        {showTransferModal && selectedPatient && (
          <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 space-y-5 text-center">
              <h3 className="font-bold text-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 mb-4"><ArrowRightLeft size={20} className="text-medical-600"/> Mudar Setor / Status</h3>
              <div className="grid gap-2.5">
                {['UTI', 'Enfermaria', 'Finalizados', 'Arquivo Morto'].map(t => (
                  <button key={t} onClick={() => setTransferTarget(t)} className={`p-3 border-2 rounded-xl text-center text-sm font-bold transition-all ${transferTarget === t ? 'border-medical-600 bg-medical-50 text-medical-800 shadow-md' : 'border-slate-100 text-slate-500'}`}>{t}</button>
                ))}
              </div>
              <button onClick={async () => { 
                try {
                  await PatientService.updatePatient(selectedPatientId!, { unit: transferTarget as any }); 
                  await loadPatients(); 
                  setShowTransferModal(false); 
                } catch (err) {
                  alert(`Erro na transferência: ${stringifyError(err)}`);
                }
              }} className="w-full bg-medical-600 text-white p-4 rounded-xl font-bold uppercase shadow-lg">Confirmar</button>
            </div>
          </div>
        )}

        {showPrintPreview && selectedPatient && <PatientPrintView patient={selectedPatient} onClose={() => setShowPrintPreview(false)} />}
        {showPlantaoPrint && <PatientListPrintView patients={filteredPatients} unit={activeTab} onClose={() => setShowPlantaoPrint(false)} />}
      </main>
    </div>
  );
}
