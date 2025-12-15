import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Activity, 
  BedDouble, 
  Calendar, 
  FileText, 
  Pill, 
  Stethoscope, 
  Microscope, 
  BrainCircuit, 
  PlusCircle, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp,
  Menu, 
  X, 
  Search, 
  ClipboardList, 
  History, 
  Save, 
  Pencil, 
  Check, 
  ArrowUp, 
  ArrowDown,
  Trash2,
  SquareCheck,
  UserPlus,
  Archive,
  RotateCcw,
  CheckCircle2,
  Printer,
  FileBarChart,
  ArrowRightLeft,
  Zap,
  Moon,
  Cable,
  Scale,
  Droplets,
  ListTodo,
  Lock,
  LogOut,
  Paperclip,
  Image as ImageIcon,
  File as FileIcon,
  Download
} from 'lucide-react';
import { Patient, DailyLog, LabResult, Attachment } from './types';
import DailyLogForm from './components/DailyLogForm';
import LabResultTable from './components/LabResultTable';
import * as PatientService from './services/patientService';

// Helper for temperature styling
const getTemperatureStyle = (tempStr: string) => {
  if (!tempStr) return "text-gray-800";
  
  // Extract numbers, handling comma or dot decimal
  const normalized = tempStr.replace(',', '.');
  const matches = normalized.match(/\d+(\.\d+)?/g);
  
  if (!matches) return "text-gray-800";
  
  let isDanger = false;
  let isWarning = false;

  matches.forEach(m => {
      const val = parseFloat(m);
      if (!isNaN(val)) {
          // Hypothermia (<35) or Hyperthermia (>37.8)
          if (val < 35 || val > 37.8) isDanger = true;
          // Warning zone (37 - 37.7)
          else if (val >= 37 && val <= 37.7) isWarning = true;
      }
  });

  if (isDanger) return "text-red-600 font-extrabold";
  if (isWarning) return "text-amber-600 font-bold";
  return "text-gray-800";
};

// Initial state for adding a new patient
const INITIAL_NEW_PATIENT_STATE: Omit<Patient, 'id' | 'dailyLogs' | 'personalHistory' | 'homeMedications' | 'diagnosticHypotheses' | 'attachments'> = {
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
  vasoactiveDrugs: '',
  sedationAnalgesia: '',
  devices: ''
};

export default function App() {
  // --- AUTHENTICATION STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  // --- APP STATE ---
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  
  // Sidebar logic changed: Default closed on mobile, open on desktop
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  
  // Tabs: 'UTI', 'Enfermaria', 'Finalizados'
  const [activeTab, setActiveTab] = useState<'UTI' | 'Enfermaria' | 'Finalizados'>('UTI');
  
  // Log Modal States
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);

  // Patient Modal States
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [newPatientData, setNewPatientData] = useState(INITIAL_NEW_PATIENT_STATE);

  // Transfer Modal States
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTarget, setTransferTarget] = useState<string>('UTI');

  // Print Modal States
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showBulkPrintPreview, setShowBulkPrintPreview] = useState(false);

  // Collapsible Sections State
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [collapsedLogs, setCollapsedLogs] = useState<Record<string, boolean>>({});

  // States for new items
  const [newDiagnosis, setNewDiagnosis] = useState('');
  const [newPersonalHistory, setNewPersonalHistory] = useState('');
  const [newHomeMed, setNewHomeMed] = useState('');
  
  // Editable fields state
  const [editingAdmission, setEditingAdmission] = useState(false);
  const [tempAdmissionHistory, setTempAdmissionHistory] = useState('');
  
  const [editingPrescription, setEditingPrescription] = useState(false);
  const [tempPrescription, setTempPrescription] = useState('');

  // ICU Details Editable State
  const [editingICUDetails, setEditingICUDetails] = useState(false);
  const [tempVasoactive, setTempVasoactive] = useState('');
  const [tempSedation, setTempSedation] = useState('');
  const [tempDevices, setTempDevices] = useState('');

  // Editing Diagnosis State
  const [editingDiagnosisIndex, setEditingDiagnosisIndex] = useState<number | null>(null);
  const [tempDiagnosisValue, setTempDiagnosisValue] = useState('');

  // Attachment Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- INITIAL LOAD ---
  useEffect(() => {
    if (isAuthenticated) {
      loadPatients();
    }
    
    const handleResize = () => {
       if (window.innerWidth >= 1024) {
           setIsSidebarOpen(true);
       } else {
           setIsSidebarOpen(false);
       }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isAuthenticated]);

  const loadPatients = async () => {
    setIsLoading(true);
    try {
      const data = await PatientService.fetchPatients();
      setPatients(data);
    } catch (error) {
      console.error("Failed to load patients", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtering Logic
  const filteredPatients = patients.filter(p => {
    if (activeTab === 'Finalizados') {
      return p.status === 'completed';
    }
    return p.unit === activeTab && p.status === 'active';
  });

  // Handle default selection when tab changes or data changes
  useEffect(() => {
      // If we have a selected patient, check if they are still in the current list
      const isSelectedVisible = filteredPatients.some(p => p.id === selectedPatientId);
      
      if (!isSelectedVisible) {
          if (filteredPatients.length > 0) {
              setSelectedPatientId(filteredPatients[0].id);
          } else {
              setSelectedPatientId(null);
          }
      } else if (!selectedPatientId && filteredPatients.length > 0) {
          // If nothing selected but we have patients, select first
          setSelectedPatientId(filteredPatients[0].id);
      }
      setShowBulkPrintPreview(false);
  }, [activeTab, patients, selectedPatientId]);

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || null;

  // Update temp states when patient changes
  useEffect(() => {
    if (selectedPatient) {
        setTempAdmissionHistory(selectedPatient.admissionHistory);
        setTempPrescription(selectedPatient.medicalPrescription || '');
        setTempVasoactive(selectedPatient.vasoactiveDrugs || '');
        setTempSedation(selectedPatient.sedationAnalgesia || '');
        setTempDevices(selectedPatient.devices || '');

        // --- UPDATE LOG COLLAPSE LOGIC ---
        // Goal: Expand ONLY the most recent log (date based). Collapse all others.
        const newCollapsedState: Record<string, boolean> = {};
        
        if (selectedPatient.dailyLogs.length > 0) {
           // Sort logs to find the newest one
           const sortedLogs = [...selectedPatient.dailyLogs].sort((a, b) => 
               new Date(a.date).getTime() - new Date(b.date).getTime()
           );
           const newestLogId = sortedLogs[sortedLogs.length - 1].id;

           // Set all to true (collapsed) except the newest one
           selectedPatient.dailyLogs.forEach(log => {
               if (log.id !== newestLogId) {
                   newCollapsedState[log.id] = true;
               }
           });
        }
        setCollapsedLogs(newCollapsedState);
    }
    setEditingDiagnosisIndex(null); 
    setEditingAdmission(false);
    setEditingPrescription(false);
    setEditingICUDetails(false);
    setEditingLog(null);
    setShowPrintPreview(false);
    setShowTransferModal(false);
    setCollapsedSections({}); 
    
    // Auto-close sidebar on mobile when selecting a patient
    if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
    }
  }, [selectedPatientId]);


  // -- Handlers --

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === '223209**') {
      setIsAuthenticated(true);
      setLoginError(false);
    } else {
      setLoginError(true);
      setPasswordInput('');
    }
  };

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const toggleLogSection = (logId: string) => {
    setCollapsedLogs(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPatientId) {
        await PatientService.updatePatient(editingPatientId, newPatientData);
        await loadPatients();
        setEditingPatientId(null);
      } else {
        const newPatient = await PatientService.createPatient(newPatientData);
        if (newPatient) {
          await loadPatients();
          setSelectedPatientId(newPatient.id);
          if (activeTab !== newPatient.unit) {
             setActiveTab(newPatient.unit);
          }
        }
      }
      setShowAddPatientModal(false);
      setNewPatientData(INITIAL_NEW_PATIENT_STATE);
    } catch (err) {
      alert('Erro ao salvar paciente.');
    }
  };

  const startEditingPatient = () => {
    if (!selectedPatient) return;
    setNewPatientData({
      name: selectedPatient.name,
      age: selectedPatient.age,
      gender: selectedPatient.gender,
      estimatedWeight: selectedPatient.estimatedWeight || 0,
      bedNumber: selectedPatient.bedNumber,
      unit: selectedPatient.unit,
      status: selectedPatient.status,
      admissionDate: selectedPatient.admissionDate,
      admissionHistory: selectedPatient.admissionHistory,
      medicalPrescription: selectedPatient.medicalPrescription
    });
    setEditingPatientId(selectedPatient.id);
    setShowAddPatientModal(true);
  };

  const handleTransferPatient = async () => {
    if (!selectedPatientId) return;
    try {
      const updates: Partial<Patient> = transferTarget === 'Finalizados' 
        ? { status: 'completed' } 
        : { status: 'active', unit: transferTarget as 'UTI' | 'Enfermaria' };
      
      await PatientService.updatePatient(selectedPatientId, updates);
      await loadPatients();
      setShowTransferModal(false);
    } catch(err) {
      alert('Erro ao transferir.');
    }
  };
  
  const handleSaveLog = async (logData: Omit<DailyLog, 'id'>) => {
    if (!selectedPatientId) return;
    
    try {
       // 1. Prepare log object (if editing, use existing ID, else temp ID for service decision)
       const logToSave: DailyLog = {
         id: editingLog ? editingLog.id : 'new',
         ...logData
       };

       await PatientService.upsertDailyLog(selectedPatientId, logToSave);

       // 2. Sync Prescription to main patient record
       const newPrescriptionText = logData.prescriptions
            .filter(line => line.trim().length > 0)
            .map((line, idx) => `${idx + 1}. ${line}`)
            .join('\n');
       
       if (newPrescriptionText) {
          await PatientService.updatePatient(selectedPatientId, { medicalPrescription: newPrescriptionText });
       }

       await loadPatients();
       setShowAddLogModal(false);
       setEditingLog(null);
    } catch(err) {
      alert('Erro ao salvar registro diário.');
    }
  };

  const handleEditLog = (log: DailyLog) => {
    setEditingLog(log);
    setShowAddLogModal(true);
  };

  const handleToggleConductVerification = async (logId: string, conductIndex: number) => {
    if (!selectedPatientId || !selectedPatient) return;
    
    // Optimistic Update
    const updatedLogs = selectedPatient.dailyLogs.map(log => {
        if (log.id === logId) {
            const newConducts = [...log.conducts];
            if (newConducts[conductIndex]) {
                newConducts[conductIndex] = {
                    ...newConducts[conductIndex],
                    verified: !newConducts[conductIndex].verified
                };
            }
            return { ...log, conducts: newConducts };
        }
        return log;
    });

    const targetLog = updatedLogs.find(l => l.id === logId);
    if(targetLog) {
       // Persist
       await PatientService.upsertDailyLog(selectedPatientId, targetLog);
       // We can reload or just set state locally
       setPatients(prev => prev.map(p => p.id === selectedPatientId ? {...p, dailyLogs: updatedLogs} : p));
    }
  };

  const handleUpdateLabResult = async (logId: string, testName: string, newValue: string, unit?: string) => {
    if (!selectedPatientId || !selectedPatient) return;

    const updatedLogs = selectedPatient.dailyLogs.map(log => {
      if (log.id === logId) {
        const existingLabIndex = log.labs.findIndex(l => l.testName === testName);
        const newLabs = [...log.labs];

        if (existingLabIndex >= 0) {
           if (newValue.trim() === '') {
             newLabs.splice(existingLabIndex, 1);
           } else {
             newLabs[existingLabIndex] = { 
                ...newLabs[existingLabIndex], 
                value: newValue,
                unit: unit !== undefined ? unit : newLabs[existingLabIndex].unit 
             };
           }
        } else if (newValue.trim() !== '') {
           const referenceLab = selectedPatient.dailyLogs
             .flatMap(l => l.labs)
             .find(l => l.testName === testName);
           
           const newLabEntry: LabResult = {
             testName,
             value: newValue,
             unit: unit || referenceLab?.unit || '',
             referenceRange: referenceLab?.referenceRange || ''
           };
           newLabs.push(newLabEntry);
        }
        return { ...log, labs: newLabs };
      }
      return log;
    });

    const targetLog = updatedLogs.find(l => l.id === logId);
    if(targetLog) {
       await PatientService.upsertDailyLog(selectedPatientId, targetLog);
       setPatients(prev => prev.map(p => p.id === selectedPatientId ? {...p, dailyLogs: updatedLogs} : p));
    }
  };

  // Generic List Updater (Hypothesis, History, Meds)
  const updatePatientList = async (field: 'diagnosticHypotheses' | 'personalHistory' | 'homeMedications', value: string, action: 'add' | 'remove', index?: number) => {
    if (!selectedPatientId || !selectedPatient) return;
    
    let newList = [...selectedPatient[field]];
    if (action === 'add') {
        if(value.trim()) newList.push(value);
    } else if (action === 'remove' && index !== undefined) {
        newList.splice(index, 1);
    }

    // Optimistic
    setPatients(prev => prev.map(p => p.id === selectedPatientId ? { ...p, [field]: newList } : p));
    
    // Persist
    await PatientService.updatePatient(selectedPatientId, { [field]: newList });
  };

  const updateHypothesesList = async (newHypotheses: string[]) => {
    if (!selectedPatientId) return;
    setPatients(prev => prev.map(p => p.id === selectedPatientId ? { ...p, diagnosticHypotheses: newHypotheses } : p));
    await PatientService.updatePatient(selectedPatientId, { diagnosticHypotheses: newHypotheses });
  };

  const saveAdmissionHistory = async () => {
    if (!selectedPatientId) return;
    await PatientService.updatePatient(selectedPatientId, { admissionHistory: tempAdmissionHistory });
    setPatients(prev => prev.map(p => p.id === selectedPatientId ? { ...p, admissionHistory: tempAdmissionHistory } : p));
    setEditingAdmission(false);
  };

  const savePrescription = async () => {
    if (!selectedPatientId) return;
    await PatientService.updatePatient(selectedPatientId, { medicalPrescription: tempPrescription });
    setPatients(prev => prev.map(p => p.id === selectedPatientId ? { ...p, medicalPrescription: tempPrescription } : p));
    setEditingPrescription(false);
  };

  const saveICUDetails = async () => {
    if (!selectedPatientId) return;
    const updates = {
        vasoactiveDrugs: tempVasoactive,
        sedationAnalgesia: tempSedation,
        devices: tempDevices
    };
    await PatientService.updatePatient(selectedPatientId, updates);
    setPatients(prev => prev.map(p => p.id === selectedPatientId ? { ...p, ...updates } : p));
    setEditingICUDetails(false);
  }

  // --- ATTACHMENT HANDLERS ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0] && selectedPatientId) {
      const file = event.target.files[0];
      try {
          const newAttachment = await PatientService.uploadAttachment(selectedPatientId, file);
          setPatients(prev => prev.map(p => {
             if (p.id === selectedPatientId) {
                return { ...p, attachments: [...p.attachments, newAttachment] };
             }
             return p;
          }));
      } catch (err) {
          alert('Erro ao enviar arquivo.');
          console.error(err);
      }
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
     if (!selectedPatientId) return;
     if (window.confirm('Tem certeza que deseja excluir este anexo?')) {
        try {
            await PatientService.deleteAttachment(attachmentId);
            setPatients(prev => prev.map(p => {
                if (p.id === selectedPatientId) {
                return { ...p, attachments: p.attachments.filter(a => a.id !== attachmentId) };
                }
                return p;
            }));
        } catch (err) {
            alert('Erro ao excluir anexo.');
        }
     }
  };

  // Calculate Cumulative Fluid Balance
  const cumulativeFluidBalance = selectedPatient?.dailyLogs.reduce((acc, log) => {
    return acc + (log.fluidBalance?.net || 0);
  }, 0) || 0;

  // Toggle strikethrough for a specific line in the prescription
  const handleTogglePrescriptionLine = async (index: number) => {
    if (!selectedPatient || !selectedPatientId) return;
    const currentText = selectedPatient.medicalPrescription || '';
    const lines = currentText.split('\n');

    if (index >= lines.length) return;

    const line = lines[index];
    // We use '~~' prefix as a convention for struck-through lines in the raw string
    if (line.startsWith('~~')) {
        lines[index] = line.substring(2);
    } else {
        lines[index] = '~~' + line;
    }

    const newText = lines.join('\n');

    setPatients(prev => prev.map(p => 
        p.id === selectedPatientId ? { ...p, medicalPrescription: newText } : p
    ));
    
    if (editingPrescription) {
        setTempPrescription(newText);
    }

    // Persist
    await PatientService.updatePatient(selectedPatientId, { medicalPrescription: newText });
  };

  const currentActivePrescriptions = selectedPatient?.medicalPrescription
    ? selectedPatient.medicalPrescription.split('\n')
        .map(line => line.replace(/^\d+\.\s*/, '')) // Remove existing numbering for the form array
        .filter(line => line.trim().length > 0 && !line.startsWith('~~')) // Don't pull in struck items
    : [];
  
  // Calculate All Pending Conducts
  const allPendingConducts = selectedPatient?.dailyLogs
    .flatMap(log => 
      log.conducts
        .filter(c => !c.verified)
        .map(c => ({
          date: log.date,
          description: c.description,
          id: log.id // good for key
        }))
    ) || [];

  // --- RENDER LOGIN SCREEN IF NOT AUTHENTICATED ---
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm border border-slate-700 m-4">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-medical-50 p-4 rounded-full mb-4">
               <Activity className="text-medical-600" size={48} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">CardioEDAD</h1>
            <p className="text-slate-500 text-sm">Sistema de Monitoramento Clínico</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Senha de Acesso</label>
              <div className="relative">
                <input 
                  type="password" 
                  autoFocus
                  className={`w-full bg-slate-50 border rounded-lg p-3 pl-10 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all text-base ${loginError ? 'border-red-300 focus:ring-red-200' : 'border-slate-300 focus:border-medical-500 focus:ring-medical-200'}`}
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setLoginError(false);
                  }}
                />
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
              </div>
              {loginError && (
                <div className="flex items-center gap-1 mt-2 text-red-500 animate-pulse">
                   <X size={12} />
                   <p className="text-xs font-medium">Senha incorreta.</p>
                </div>
              )}
            </div>
            <button 
              type="submit" 
              className="w-full bg-medical-600 hover:bg-medical-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Users size={18} /> Acessar Sistema
            </button>
          </form>
          
          <div className="mt-8 text-center border-t border-slate-100 pt-4">
             <p className="text-[10px] text-slate-400 uppercase tracking-widest">Acesso Restrito &bull; Equipe Médica</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 lg:static transition-all duration-300 transform ${isSidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full lg:translate-x-0 lg:w-0'} bg-slate-900 text-white flex flex-col overflow-hidden shadow-xl`}
      >
        <div className="p-6 border-b border-slate-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
             <Activity className="text-medical-500" size={28} />
             <h1 className="text-xl font-bold tracking-tight">CardioEDAD</h1>
          </div>
          {/* Close button for mobile */}
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400">
             <X size={24} />
          </button>
        </div>

        {/* Unit Tabs */}
        <div className="flex border-b border-slate-700">
           <button 
             className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'UTI' ? 'bg-medical-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
             onClick={() => setActiveTab('UTI')}
           >
             UTI
           </button>
           <button 
             className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'Enfermaria' ? 'bg-medical-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
             onClick={() => setActiveTab('Enfermaria')}
           >
             Enfermaria
           </button>
           <button 
             className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'Finalizados' ? 'bg-medical-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
             onClick={() => setActiveTab('Finalizados')}
           >
             Finalizados
           </button>
        </div>
        
        <div className="p-4 space-y-3">
           <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input type="text" placeholder="Buscar pacientes..." className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-medical-500 text-slate-200 placeholder-slate-500" />
           </div>
           
           <div className="flex gap-2">
             <button 
                onClick={() => { setEditingPatientId(null); setNewPatientData(INITIAL_NEW_PATIENT_STATE); setShowAddPatientModal(true); }}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 py-3 rounded-lg text-sm transition-colors"
                title="Adicionar Paciente"
             >
                <UserPlus size={16} /> Adicionar
             </button>
             <button
               onClick={() => setShowBulkPrintPreview(true)}
               disabled={filteredPatients.length === 0}
               className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 py-3 px-3 rounded-lg text-sm transition-colors disabled:opacity-50"
               title={`Imprimir Lista da ${activeTab}`}
             >
                <Printer size={16} />
             </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-20 lg:pb-0">
          {filteredPatients.length === 0 && (
             <div className="text-center text-slate-500 text-sm mt-10 p-4">
                {isLoading ? 'Carregando...' : `Nenhum paciente ${activeTab === 'Finalizados' ? 'finalizado' : `na ${activeTab}`}.`}
             </div>
          )}
          {filteredPatients.map(patient => (
            <div 
              key={patient.id}
              onClick={() => setSelectedPatientId(patient.id)}
              className={`p-4 rounded-lg mb-2 cursor-pointer transition-colors group border border-transparent ${selectedPatientId === patient.id ? 'bg-medical-600 border-medical-500' : 'bg-slate-800/50 hover:bg-slate-800 border-slate-800'}`}
            >
              <div className="flex justify-between items-start">
                <span className="font-medium text-slate-100 text-base">{patient.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${selectedPatientId === patient.id ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'}`}>
                  {patient.bedNumber}
                </span>
              </div>
              <div className="text-sm text-slate-400 mt-1 flex gap-2">
                 <span>{patient.gender}</span> • <span>{patient.age} anos</span>
                 {activeTab === 'Finalizados' && <span className="text-medical-400 ml-auto">{patient.unit}</span>}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-slate-700 bg-slate-900 z-10">
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-900/30 text-slate-300 hover:text-red-200 border border-slate-700 hover:border-red-800/50 py-3 rounded-lg transition-all text-sm mb-4"
          >
            <LogOut size={16} /> Sair do Sistema
          </button>
          <div className="text-xs text-slate-500 text-center">
             v1.2.3 • Ambiente Seguro
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        {selectedPatient ? (
            <>
                {/* Header - Optimized for Mobile */}
                <header className="print:hidden bg-white border-b h-auto min-h-[64px] py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 shadow-sm z-10 shrink-0 gap-3">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 rounded-md text-gray-600 lg:hidden">
                       <Menu size={24} />
                    </button>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 rounded-md text-gray-600 hidden lg:block">
                       {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-2">
                          <h2 className="text-lg font-bold text-gray-900 truncate">{selectedPatient.name}</h2>
                          <span className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${selectedPatient.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600'}`}>
                            {selectedPatient.status === 'completed' ? 'Alta/Finalizado' : selectedPatient.unit}
                          </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1 whitespace-nowrap"><BedDouble size={14} /> {selectedPatient.bedNumber}</span>
                        <span className="flex items-center gap-1 whitespace-nowrap"><Calendar size={14} /> Adm: {new Date(selectedPatient.admissionDate).toLocaleDateString('pt-BR')}</span>
                        <span className="flex items-center gap-1 whitespace-nowrap"><Scale size={14} /> {selectedPatient.estimatedWeight ? `${selectedPatient.estimatedWeight}kg` : 'Peso NR'}</span>
                        
                        <button onClick={startEditingPatient} className="flex items-center gap-1 text-medical-600 hover:text-medical-800 hover:underline ml-auto sm:ml-2 p-1">
                           <Pencil size={12} /> Editar
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <button 
                      type="button" 
                      onClick={() => setShowPrintPreview(true)} 
                      className="p-2 text-gray-600 hover:text-medical-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                      title="Imprimir Resumo"
                    >
                      <Printer size={20} />
                    </button>

                    <button 
                      type="button"
                      onClick={() => {
                        setTransferTarget(selectedPatient.status === 'completed' ? 'UTI' : selectedPatient.unit);
                        setShowTransferModal(true);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium shadow transition-colors border bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      title="Transferir Paciente"
                    >
                       <ArrowRightLeft size={16} />
                       <span className="hidden sm:inline">Transferir</span>
                    </button>

                    {selectedPatient.status === 'active' && (
                        <button 
                        type="button"
                        onClick={() => { setEditingLog(null); setShowAddLogModal(true); }}
                        className="flex items-center gap-2 bg-medical-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow hover:bg-medical-700 transition-colors whitespace-nowrap"
                        >
                        <PlusCircle size={16} /> <span className="hidden sm:inline">Novo Registro</span><span className="sm:hidden">Novo</span>
                        </button>
                    )}
                  </div>
                </header>

                {/* Pending Conducts Bar - Compact (All open items) */}
                {allPendingConducts.length > 0 && (
                  <div className="bg-orange-50 border-b border-orange-100 px-4 sm:px-6 py-2 flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs sm:text-sm text-orange-800 print:hidden transition-all">
                     <div className="flex items-center gap-1 font-bold shrink-0">
                        <ListTodo size={16} className="text-orange-600"/>
                        <span>Pendências:</span>
                     </div>
                     <div className="flex-1 flex flex-wrap gap-2">
                        {allPendingConducts.map((item, i) => (
                           <span key={i} className="flex items-center gap-1 bg-white/50 px-2 py-0.5 rounded border border-orange-100 w-full sm:w-auto" title={`${new Date(item.date).toLocaleDateString('pt-BR')} - ${item.description}`}>
                             <span className="text-[10px] font-semibold text-orange-600/70 bg-orange-100 px-1 rounded whitespace-nowrap">
                                {new Date(item.date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}
                             </span>
                             <span className="truncate">{item.description}</span>
                           </span>
                        ))}
                     </div>
                  </div>
                )}

                {/* Scrollable Dashboard */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 print:hidden">
                  
                  {/* Clinical Context Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    
                    {/* Card 1: Admission History */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 flex flex-col transition-all">
                       <div 
                         className="flex items-center justify-between mb-4 border-b pb-2 cursor-pointer touch-manipulation"
                         onClick={() => toggleSection('admission')}
                       >
                         <div className="flex items-center gap-2 text-medical-700 font-semibold">
                            <FileText size={20} />
                            <h3>História da Admissão</h3>
                         </div>
                         <div className="flex items-center gap-3">
                             <button 
                               onClick={(e) => {
                                   e.stopPropagation();
                                   editingAdmission ? saveAdmissionHistory() : setEditingAdmission(true);
                               }} 
                               className="text-xs text-medical-600 hover:text-medical-800 font-medium z-10 p-2 -m-2"
                             >
                               {editingAdmission ? 'Salvar' : 'Editar'}
                             </button>
                             {collapsedSections['admission'] ? <ChevronDown size={18} className="text-gray-400"/> : <ChevronUp size={18} className="text-gray-400"/>}
                         </div>
                       </div>
                       
                       {!collapsedSections['admission'] && (
                         <div className="flex-1 relative">
                           {editingAdmission ? (
                             <textarea 
                               className="w-full h-full min-h-[150px] p-3 text-base sm:text-sm border rounded-md focus:border-medical-500 outline-none resize-none bg-gray-50"
                               value={tempAdmissionHistory}
                               onChange={(e) => setTempAdmissionHistory(e.target.value)}
                               onClick={(e) => e.stopPropagation()}
                             />
                           ) : (
                             <p className="text-sm text-justify text-gray-700 leading-relaxed whitespace-pre-line">
                               {selectedPatient.admissionHistory || <span className="text-gray-400 italic">Nenhum histórico registrado.</span>}
                             </p>
                           )}
                         </div>
                       )}
                    </div>

                    {/* Card 2: History & Meds */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 flex flex-col transition-all">
                       <div 
                         className="flex items-center justify-between mb-4 border-b pb-2 cursor-pointer touch-manipulation"
                         onClick={() => toggleSection('history')}
                       >
                           <div className="flex items-center gap-2 text-medical-700 font-semibold">
                              <History size={20} />
                              <h3>Histórico Clínico</h3>
                           </div>
                           {collapsedSections['history'] ? <ChevronDown size={18} className="text-gray-400"/> : <ChevronUp size={18} className="text-gray-400"/>}
                       </div>
                       
                       {!collapsedSections['history'] && (
                         <div className="flex flex-col gap-6">
                            {/* Personal History */}
                            <div className="flex-1 flex flex-col">
                                <div className="flex items-center gap-2 mb-2 text-gray-800 font-semibold text-sm">
                                <History size={16} className="text-medical-600"/>
                                <h3>Antecedentes Pessoais</h3>
                                </div>
                                <ul className="space-y-2 mb-2">
                                {selectedPatient.personalHistory.map((item, i) => (
                                    <li key={i} className="flex justify-between items-start text-sm text-gray-700 group bg-gray-50 p-2 rounded">
                                    <span className="flex-1 flex gap-2"><span className="text-gray-400">•</span> {item}</span>
                                    <button onClick={() => updatePatientList('personalHistory', '', 'remove', i)} className="text-gray-400 hover:text-red-400 p-1"><X size={16}/></button>
                                    </li>
                                ))}
                                </ul>
                                <div className="flex gap-2 mt-auto">
                                <input type="text" value={newPersonalHistory} onChange={e => setNewPersonalHistory(e.target.value)} onKeyDown={e => e.key === 'Enter' && (updatePatientList('personalHistory', newPersonalHistory, 'add'), setNewPersonalHistory(''))} placeholder="Adicionar antecedente..." className="flex-1 text-base sm:text-sm border rounded px-3 py-2 outline-none focus:border-medical-500"/>
                                <button onClick={() => {updatePatientList('personalHistory', newPersonalHistory, 'add'); setNewPersonalHistory('')}} className="bg-gray-100 text-gray-600 px-3 rounded text-xs"><PlusCircle size={18}/></button>
                                </div>
                            </div>

                            <div className="border-t pt-4 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 mb-2 text-gray-800 font-semibold text-sm">
                                <Pill size={16} className="text-medical-600"/>
                                <h3>Medicamentos de Uso Contínuo</h3>
                                </div>
                                <ul className="space-y-2 mb-2">
                                {selectedPatient.homeMedications.map((item, i) => (
                                    <li key={i} className="flex justify-between items-start text-sm text-gray-700 group bg-gray-50 p-2 rounded">
                                    <span className="flex-1 flex gap-2"><span className="text-gray-400">•</span> {item}</span>
                                    <button onClick={() => updatePatientList('homeMedications', '', 'remove', i)} className="text-gray-400 hover:text-red-400 p-1"><X size={16}/></button>
                                    </li>
                                ))}
                                </ul>
                                <div className="flex gap-2 mt-auto">
                                <input type="text" value={newHomeMed} onChange={e => setNewHomeMed(e.target.value)} onKeyDown={e => e.key === 'Enter' && (updatePatientList('homeMedications', newHomeMed, 'add'), setNewHomeMed(''))} placeholder="Adicionar medicamento..." className="flex-1 text-base sm:text-sm border rounded px-3 py-2 outline-none focus:border-medical-500"/>
                                <button onClick={() => {updatePatientList('homeMedications', newHomeMed, 'add'); setNewHomeMed('')}} className="bg-gray-100 text-gray-600 px-3 rounded text-xs"><PlusCircle size={18}/></button>
                                </div>
                            </div>
                         </div>
                       )}
                    </div>

                    {/* Card 3: Diagnostic Hypothesis */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 flex flex-col transition-all">
                       <div 
                         className="flex items-center justify-between mb-4 border-b pb-2 cursor-pointer touch-manipulation"
                         onClick={() => toggleSection('hypotheses')}
                       >
                         <div className="flex items-center gap-2 text-medical-700 font-semibold">
                           <BrainCircuit size={20} />
                           <h3>Hipóteses Diagnósticas</h3>
                         </div>
                         {collapsedSections['hypotheses'] ? <ChevronDown size={18} className="text-gray-400"/> : <ChevronUp size={18} className="text-gray-400"/>}
                       </div>
                       
                       {!collapsedSections['hypotheses'] && (
                         <div className="flex flex-col h-full">
                           <ul className="space-y-2 flex-1 mb-4">
                             {selectedPatient.diagnosticHypotheses.map((dx, i) => {
                               // -- EDIT MODE --
                               if (editingDiagnosisIndex === i) {
                                 return (
                                   <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                     <span className="w-1.5 h-1.5 bg-gray-300 rounded-full shrink-0"></span>
                                     <input
                                        autoFocus
                                        className="flex-1 border rounded px-2 py-2 outline-none focus:border-medical-500 text-base sm:text-sm"
                                        value={tempDiagnosisValue}
                                        onChange={(e) => setTempDiagnosisValue(e.target.value)}
                                        onKeyDown={(e) => {
                                           if (e.key === 'Enter') {
                                               const list = [...selectedPatient.diagnosticHypotheses];
                                               if (tempDiagnosisValue.trim()) {
                                                  list[i] = tempDiagnosisValue;
                                                  updateHypothesesList(list);
                                               }
                                               setEditingDiagnosisIndex(null);
                                           } else if (e.key === 'Escape') {
                                               setEditingDiagnosisIndex(null);
                                           }
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                     />
                                     <button onClick={(e) => {
                                         e.stopPropagation();
                                         const list = [...selectedPatient.diagnosticHypotheses];
                                         if (tempDiagnosisValue.trim()) {
                                            list[i] = tempDiagnosisValue;
                                            updateHypothesesList(list);
                                         }
                                         setEditingDiagnosisIndex(null);
                                     }} className="text-green-600 hover:bg-green-50 p-2 rounded" title="Salvar">
                                         <Check size={20}/>
                                     </button>
                                     <button onClick={(e) => { e.stopPropagation(); setEditingDiagnosisIndex(null); }} className="text-gray-400 hover:bg-gray-100 p-2 rounded" title="Cancelar">
                                         <X size={20}/>
                                     </button>
                                   </li>
                                 );
                               }

                               // -- VIEW MODE --
                               return (
                                 <li key={i} className="flex items-start gap-2 text-sm text-gray-700 group min-h-[32px] p-1">
                                    <span className="mt-2 w-1.5 h-1.5 bg-medical-500 rounded-full shrink-0"></span>
                                    <span className="flex-1 pt-0.5">{dx}</span>
                                    
                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button 
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingDiagnosisIndex(i);
                                              setTempDiagnosisValue(dx);
                                          }} 
                                          className="text-gray-400 hover:text-medical-600 hover:bg-gray-100 p-2 rounded" title="Editar"
                                        >
                                          <Pencil size={16}/>
                                        </button>
                                        
                                        <div className="flex items-center">
                                            <button 
                                              disabled={i === 0}
                                              onClick={(e) => {
                                                  e.stopPropagation();
                                                  const list = [...selectedPatient.diagnosticHypotheses];
                                                  if (i > 0) {
                                                      [list[i-1], list[i]] = [list[i], list[i-1]];
                                                      updateHypothesesList(list);
                                                  }
                                              }} 
                                              className={`text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded ${i === 0 ? 'invisible' : ''}`}
                                              title="Mover para cima"
                                            >
                                              <ArrowUp size={16}/>
                                            </button>
                                            <button 
                                              disabled={i === selectedPatient.diagnosticHypotheses.length - 1}
                                               onClick={(e) => {
                                                  e.stopPropagation();
                                                  const list = [...selectedPatient.diagnosticHypotheses];
                                                  if (i < list.length - 1) {
                                                      [list[i+1], list[i]] = [list[i], list[i+1]];
                                                      updateHypothesesList(list);
                                                  }
                                              }}
                                              className={`text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded ${i === selectedPatient.diagnosticHypotheses.length - 1 ? 'invisible' : ''}`}
                                              title="Mover para baixo"
                                            >
                                              <ArrowDown size={16}/>
                                            </button>
                                        </div>

                                        <button 
                                          onClick={(e) => { e.stopPropagation(); updatePatientList('diagnosticHypotheses', '', 'remove', i); }} 
                                          className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded ml-1" title="Remover"
                                        >
                                          <X size={16}/>
                                        </button>
                                    </div>
                                 </li>
                               );
                             })}
                             {selectedPatient.diagnosticHypotheses.length === 0 && <li className="text-sm text-gray-400 italic">Nenhum diagnóstico registrado.</li>}
                           </ul>
                           <div className="flex gap-2 mt-auto pt-2">
                             <input 
                               type="text" 
                               value={newDiagnosis}
                               onChange={(e) => setNewDiagnosis(e.target.value)}
                               onKeyDown={(e) => e.key === 'Enter' && (updatePatientList('diagnosticHypotheses', newDiagnosis, 'add'), setNewDiagnosis(''))}
                               placeholder="Adicionar hipótese..." 
                               className="flex-1 text-base sm:text-sm border rounded-md px-3 py-2 focus:border-medical-500 outline-none"
                             />
                             <button onClick={() => {updatePatientList('diagnosticHypotheses', newDiagnosis, 'add'); setNewDiagnosis('')}} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-md text-sm font-medium">Adicionar</button>
                           </div>
                         </div>
                       )}
                    </div>

                  </div>

                  {/* Lab Results Table */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 transition-all">
                     <div 
                       className="flex items-center justify-between mb-4 cursor-pointer touch-manipulation"
                       onClick={() => toggleSection('labs')}
                     >
                       <div className="flex items-center gap-2 text-medical-700 font-semibold">
                         <Microscope size={20} />
                         <h3>Comparativo de Exames Laboratoriais</h3>
                       </div>
                       {collapsedSections['labs'] ? <ChevronDown size={18} className="text-gray-400"/> : <ChevronUp size={18} className="text-gray-400"/>}
                     </div>
                     
                     {!collapsedSections['labs'] && (
                        <LabResultTable logs={selectedPatient.dailyLogs} onUpdateValue={handleUpdateLabResult} />
                     )}
                  </div>

                  {/* Medical Prescription Section */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 flex flex-col transition-all">
                       <div 
                         className="flex items-center justify-between mb-4 border-b pb-2 cursor-pointer touch-manipulation"
                         onClick={() => toggleSection('prescription')}
                       >
                         <div className="flex items-center gap-2 text-medical-700 font-semibold">
                            <ClipboardList size={20} />
                            <h3>Prescrição Médica</h3>
                         </div>
                         <div className="flex items-center gap-3">
                             <button 
                               onClick={(e) => {
                                   e.stopPropagation();
                                   editingPrescription ? savePrescription() : setEditingPrescription(true);
                               }} 
                               className="text-xs text-medical-600 hover:text-medical-800 font-medium z-10 p-2 -m-2"
                             >
                               {editingPrescription ? 'Salvar' : 'Editar'}
                             </button>
                             {collapsedSections['prescription'] ? <ChevronDown size={18} className="text-gray-400"/> : <ChevronUp size={18} className="text-gray-400"/>}
                         </div>
                       </div>
                       
                       {!collapsedSections['prescription'] && (
                         <div className="flex-1 relative">
                           {editingPrescription ? (
                             <textarea 
                               className="w-full h-full min-h-[200px] p-3 text-base sm:text-sm border rounded-md focus:border-medical-500 outline-none resize-y bg-gray-50"
                               value={tempPrescription}
                               onChange={(e) => setTempPrescription(e.target.value)}
                               onClick={(e) => e.stopPropagation()}
                             />
                           ) : (
                             <div className="bg-gray-50 p-4 rounded border border-gray-100">
                               {selectedPatient.medicalPrescription ? (
                                  <div className="columns-1 md:columns-2 gap-x-6 space-y-1">
                                      {selectedPatient.medicalPrescription.split('\n').map((line, idx) => {
                                          if (!line.trim()) return null;
                                          // Check for strikethrough marker
                                          const isStruck = line.startsWith('~~');
                                          const displayText = isStruck ? line.substring(2) : line;
                                          
                                          return (
                                              <div 
                                                  key={idx} 
                                                  onClick={() => handleTogglePrescriptionLine(idx)}
                                                  className={`text-sm leading-relaxed p-1 rounded break-inside-avoid transition-colors cursor-pointer hover:bg-gray-100 ${isStruck ? 'line-through text-gray-400' : 'text-gray-800'}`}
                                              >
                                                  {displayText}
                                              </div>
                                          );
                                      })}
                                  </div>
                               ) : (
                                  <span className="text-gray-400 italic text-sm">Nenhuma prescrição registrada.</span>
                               )}
                             </div>
                           )}
                         </div>
                       )}
                  </div>

                  {/* ICU Specific Details - Only for UTI Patients */}
                  {selectedPatient.unit === 'UTI' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 flex flex-col transition-all">
                       <div 
                         className="flex items-center justify-between mb-4 border-b pb-2 cursor-pointer touch-manipulation"
                         onClick={() => toggleSection('icu')}
                       >
                         <div className="flex items-center gap-2 text-medical-700 font-semibold">
                            <Activity size={20} />
                            <h3>Suporte Intensivo</h3>
                         </div>
                         <div className="flex items-center gap-3">
                             <button 
                               onClick={(e) => {
                                   e.stopPropagation();
                                   editingICUDetails ? saveICUDetails() : setEditingICUDetails(true);
                               }} 
                               className="text-xs text-medical-600 hover:text-medical-800 font-medium z-10 p-2 -m-2"
                             >
                               {editingICUDetails ? 'Salvar' : 'Editar'}
                             </button>
                             {collapsedSections['icu'] ? <ChevronDown size={18} className="text-gray-400"/> : <ChevronUp size={18} className="text-gray-400"/>}
                         </div>
                       </div>
                       
                       {!collapsedSections['icu'] && (
                         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                             
                             {/* Cumulative Fluid Balance (Calculated) */}
                             <div className="bg-blue-50/50 p-3 rounded border border-blue-100">
                                <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                                   <Droplets size={16} className="text-blue-500" />
                                   <h4>Balanço Hídrico Acumulado</h4>
                                </div>
                                <div className={`text-2xl font-bold ${cumulativeFluidBalance > 0 ? 'text-blue-600' : cumulativeFluidBalance < 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                                   {cumulativeFluidBalance > 0 ? '+' : ''}{cumulativeFluidBalance} ml
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">Soma de todo o período</p>
                             </div>

                             {/* Vasoactive Drugs */}
                             <div>
                                <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                                   <Zap size={16} className="text-amber-500" />
                                   <h4>Drogas Vasoativas</h4>
                                </div>
                                {editingICUDetails ? (
                                  <textarea
                                    className="w-full h-24 p-2 text-base sm:text-sm border rounded bg-gray-50 focus:border-medical-500 outline-none resize-none"
                                    value={tempVasoactive}
                                    onChange={(e) => setTempVasoactive(e.target.value)}
                                    placeholder="Ex: Noradrenalina..."
                                  />
                                ) : (
                                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-100 min-h-[60px]">
                                    {selectedPatient.vasoactiveDrugs ? selectedPatient.vasoactiveDrugs : <span className="text-gray-400 italic">Sem drogas vasoativas.</span>}
                                  </div>
                                )}
                             </div>

                             {/* Sedation & Analgesia */}
                             <div>
                                <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                                   <Moon size={16} className="text-indigo-500" />
                                   <h4>Sedoanalgesia</h4>
                                </div>
                                {editingICUDetails ? (
                                  <textarea
                                    className="w-full h-24 p-2 text-base sm:text-sm border rounded bg-gray-50 focus:border-medical-500 outline-none resize-none"
                                    value={tempSedation}
                                    onChange={(e) => setTempSedation(e.target.value)}
                                    placeholder="Ex: Propofol, Fentanil..."
                                  />
                                ) : (
                                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-100 min-h-[60px]">
                                    {selectedPatient.sedationAnalgesia ? selectedPatient.sedationAnalgesia : <span className="text-gray-400 italic">Sem sedação contínua.</span>}
                                  </div>
                                )}
                             </div>

                             {/* Invasive Devices */}
                             <div>
                                <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                                   <Cable size={16} className="text-slate-500" />
                                   <h4>Dispositivos Invasivos</h4>
                                </div>
                                {editingICUDetails ? (
                                  <textarea
                                    className="w-full h-24 p-2 text-base sm:text-sm border rounded bg-gray-50 focus:border-medical-500 outline-none resize-none"
                                    value={tempDevices}
                                    onChange={(e) => setTempDevices(e.target.value)}
                                    placeholder="Ex: CVC, PAM, SNE..."
                                  />
                                ) : (
                                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-100 min-h-[60px]">
                                    {selectedPatient.devices ? selectedPatient.devices : <span className="text-gray-400 italic">Nenhum dispositivo registrado.</span>}
                                  </div>
                                )}
                             </div>

                         </div>
                       )}
                    </div>
                  )}

                  {/* Daily Logs */}
                  <div className="space-y-6 transition-all">
                     <div 
                       className="flex items-center gap-2 cursor-pointer touch-manipulation"
                       onClick={() => toggleSection('logs')}
                     >
                       <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                         <FileText size={20} /> Progressão Diária
                       </h3>
                       {collapsedSections['logs'] ? <ChevronDown size={20} className="text-gray-500"/> : <ChevronUp size={20} className="text-gray-500"/>}
                     </div>
                     
                     {!collapsedSections['logs'] && (
                        <>
                          {selectedPatient.dailyLogs.length === 0 && <p className="text-gray-500 italic">Nenhum registro diário gravado.</p>}

                          {[...selectedPatient.dailyLogs].reverse().map(log => (
                            <div key={log.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group transition-all">
                              <div 
                                className="bg-gray-50 px-5 py-4 border-b flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors touch-manipulation"
                                onClick={() => toggleLogSection(log.id)}
                              >
                                <div className="flex items-center gap-2">
                                  {collapsedLogs[log.id] ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronUp size={18} className="text-gray-400" />}
                                  <span className="font-semibold text-gray-900">{new Date(log.date).toLocaleDateString('pt-BR', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</span>
                                </div>
                                <div className="flex items-center gap-4 relative z-10">
                                    {/* Fluid Balance Badge in Log Header (If present) */}
                                    {log.fluidBalance && (
                                      <div className={`hidden sm:flex text-xs font-bold px-2 py-1 rounded border items-center gap-1 ${log.fluidBalance.net > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                        <Droplets size={12}/>
                                        BH: {log.fluidBalance.net > 0 ? '+' : ''}{log.fluidBalance.net}ml
                                      </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <button 
                                          type="button" 
                                          onClick={(e) => { e.stopPropagation(); handleEditLog(log); }} 
                                          className="p-2 text-gray-400 hover:text-medical-600 hover:bg-gray-100 rounded-md transition-colors relative z-20" 
                                          title="Editar Registro"
                                        >
                                          <Pencil size={20} />
                                        </button>
                                        
                                    </div>
                                </div>
                              </div>
                              
                              {!collapsedLogs[log.id] && (
                                <div className="p-4 sm:p-5 space-y-4">
                                  {/* Mobile Fluid Balance Badge */}
                                  {log.fluidBalance && (
                                    <div className={`sm:hidden text-xs font-bold px-3 py-2 rounded border flex items-center justify-between gap-1 mb-2 ${log.fluidBalance.net > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                      <div className="flex items-center gap-1"><Droplets size={14}/> Balanço Hídrico</div>
                                      <span>{log.fluidBalance.net > 0 ? '+' : ''}{log.fluidBalance.net}ml</span>
                                    </div>
                                  )}

                                  {/* Vitals Snapshot */}
                                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center bg-blue-50/50 p-3 rounded-lg">
                                    <div className="p-1"><div className="text-[10px] uppercase text-gray-500">Temp</div><div className={`font-bold ${getTemperatureStyle(log.vitalSigns.temperature)}`}>{log.vitalSigns.temperature}°</div></div>
                                    <div className="p-1"><div className="text-[10px] uppercase text-gray-500">FC</div><div className="font-bold text-gray-800">{log.vitalSigns.heartRate}</div></div>
                                    <div className="p-1"><div className="text-[10px] uppercase text-gray-500">FR</div><div className="font-bold text-gray-800">{log.vitalSigns.respiratoryRate}</div></div>
                                    <div className="p-1"><div className="text-[10px] uppercase text-gray-500">PA</div><div className="font-bold text-gray-800">{log.vitalSigns.bloodPressureSys}/{log.vitalSigns.bloodPressureDia}</div></div>
                                    <div className="p-1"><div className="text-[10px] uppercase text-gray-500">SpO2</div><div className="font-bold text-gray-800">{log.vitalSigns.oxygenSaturation}%</div></div>
                                    <div className="p-1"><div className="text-[10px] uppercase text-gray-500">Glicemia</div><div className="font-bold text-gray-800">{log.vitalSigns.capillaryBloodGlucose || '-'}</div></div>
                                  </div>

                                  {/* Notes */}
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Stethoscope size={12}/> Anotações</h4>
                                    <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded border border-gray-100">{log.notes}</p>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* Prescriptions */}
                                      <div>
                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><Pill size={12}/> Prescrições</h4>
                                        <ul className="text-sm space-y-1">
                                          {log.prescriptions.map((Rx, i) => (
                                            <li key={i} className="flex gap-2 text-gray-700">
                                              <span className="text-medical-500">•</span> {Rx}
                                            </li>
                                          ))}
                                          {log.prescriptions.length === 0 && <li className="text-gray-400 italic text-xs">Nenhuma</li>}
                                        </ul>
                                      </div>

                                      {/* Conducts (formerly Procedures) */}
                                      <div>
                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><Activity size={12}/> Condutas Diárias</h4>
                                        <ul className="text-sm space-y-2 sm:space-y-1">
                                          {log.conducts.map((conduct, i) => (
                                            <li key={i} className="flex gap-2 items-start text-gray-700 group/conduct">
                                              <button 
                                                  onClick={() => handleToggleConductVerification(log.id, i)}
                                                  className={`mt-0.5 w-6 h-6 sm:w-4 sm:h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${conduct.verified ? 'bg-green-100 border-green-500 text-green-600' : 'border-gray-300 bg-white hover:border-medical-500'}`}
                                                  title={conduct.verified ? "Desmarcar" : "Marcar como realizado"}
                                              >
                                                  {conduct.verified && <Check size={14} />}
                                              </button>
                                              <span 
                                                onClick={() => handleToggleConductVerification(log.id, i)}
                                                className={`cursor-pointer transition-colors py-0.5 ${conduct.verified ? 'text-gray-500 line-through decoration-gray-400/50' : 'group-hover/conduct:text-medical-700'}`}
                                              >
                                                {conduct.description}
                                              </span>
                                            </li>
                                          ))}
                                          {log.conducts.length === 0 && <li className="text-gray-400 italic text-xs">Nenhuma</li>}
                                        </ul>
                                      </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </>
                     )}
                  </div>

                  {/* ATTACHMENTS SECTION */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 flex flex-col transition-all pb-10">
                     <div 
                         className="flex items-center justify-between mb-4 border-b pb-2 cursor-pointer touch-manipulation"
                         onClick={() => toggleSection('attachments')}
                       >
                         <div className="flex items-center gap-2 text-medical-700 font-semibold">
                            <Paperclip size={20} />
                            <h3>Anexos (Exames, Imagens e Documentos)</h3>
                         </div>
                         <div className="flex items-center gap-3">
                             {collapsedSections['attachments'] ? <ChevronDown size={18} className="text-gray-400"/> : <ChevronUp size={18} className="text-gray-400"/>}
                         </div>
                     </div>

                     {!collapsedSections['attachments'] && (
                        <div>
                            {/* Hidden File Input */}
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              onChange={handleFileUpload} 
                              className="hidden" 
                              accept="image/*, .pdf, .doc, .docx"
                            />
                            
                            {/* Action Buttons */}
                            <div className="flex gap-3 mb-4">
                                <button 
                                  onClick={() => fileInputRef.current?.click()}
                                  className="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto justify-center"
                                >
                                  <ImageIcon size={16} /> Adicionar Foto / Arquivo
                                </button>
                            </div>

                            {/* Attachments List/Grid */}
                            {selectedPatient.attachments.length === 0 ? (
                                <p className="text-sm text-gray-400 italic bg-gray-50 p-4 rounded text-center">Nenhum anexo registrado.</p>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                   {selectedPatient.attachments.map(att => (
                                      <div key={att.id} className="group relative border rounded-lg overflow-hidden bg-gray-50 hover:shadow-md transition-shadow">
                                         
                                         {/* Delete Button (Hover) */}
                                         <button 
                                            onClick={() => handleDeleteAttachment(att.id)}
                                            className="absolute top-1 right-1 bg-white/80 p-2 rounded-full text-gray-500 hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10"
                                            title="Excluir"
                                         >
                                            <Trash2 size={16} />
                                         </button>

                                         {/* Content Preview */}
                                         <div className="aspect-square flex items-center justify-center bg-gray-100 overflow-hidden">
                                            {att.type === 'image' ? (
                                               <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                                            ) : (
                                               <FileIcon size={32} className="text-gray-400" />
                                            )}
                                         </div>
                                         
                                         {/* Footer Info */}
                                         <div className="p-2 bg-white border-t">
                                            <p className="text-xs font-medium text-gray-700 truncate" title={att.name}>{att.name}</p>
                                            <p className="text-[10px] text-gray-400">{new Date(att.date).toLocaleDateString('pt-BR')}</p>
                                            <a 
                                              href={att.url} 
                                              download={att.name}
                                              className="text-[10px] text-medical-600 hover:underline flex items-center gap-1 mt-1 p-1"
                                            >
                                               <Download size={12} /> Baixar
                                            </a>
                                         </div>
                                      </div>
                                   ))}
                                </div>
                            )}
                        </div>
                     )}
                  </div>
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 print:hidden p-6 text-center">
               <div className="bg-gray-200 p-4 rounded-full mb-4">
                 <Activity size={48} className="text-gray-400" />
               </div>
               <h2 className="text-xl font-semibold text-gray-600 mb-2">Bem-vindo ao CardioEDAD</h2>
               <p className="max-w-md text-center text-sm">Selecione um paciente da {activeTab} no menu lateral para visualizar ou adicionar novos registros.</p>
               <button onClick={() => setIsSidebarOpen(true)} className="mt-8 text-medical-600 hover:text-medical-800 font-medium md:hidden px-6 py-3 border border-medical-200 rounded-lg">Abrir Menu de Pacientes</button>
            </div>
        )}

        {/* Modal for New Log */}
        {showAddLogModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 md:p-4 print:hidden">
            <div className="bg-white md:rounded-xl shadow-2xl w-full h-full md:h-auto md:max-h-[90vh] md:max-w-3xl overflow-hidden flex flex-col">
              <div className="p-4 border-b flex justify-between items-center bg-white z-10 shrink-0">
                <h3 className="text-lg font-bold text-gray-900">{editingLog ? 'Editar Registro' : 'Novo Registro'}</h3>
                <button onClick={() => { setShowAddLogModal(false); setEditingLog(null); }} className="text-gray-400 hover:text-gray-600 p-2">
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <DailyLogForm 
                  onSave={handleSaveLog} 
                  onCancel={() => { setShowAddLogModal(false); setEditingLog(null); }} 
                  initialPrescriptions={currentActivePrescriptions}
                  initialData={editingLog || undefined}
                  patientUnit={selectedPatient?.unit}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal for New/Edit Patient */}
        {showAddPatientModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 md:p-4 print:hidden">
            <div className="bg-white md:rounded-xl shadow-2xl w-full h-full md:h-auto md:max-h-[90vh] md:max-w-md overflow-hidden flex flex-col">
              <div className="p-4 border-b flex justify-between items-center bg-white shrink-0">
                <h3 className="text-lg font-bold text-gray-900">{editingPatientId ? 'Editar Paciente' : 'Novo Paciente'}</h3>
                <button onClick={() => setShowAddPatientModal(false)} className="text-gray-400 hover:text-gray-600 p-2">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSavePatient} className="flex-1 overflow-y-auto p-6 space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                    <input 
                      required
                      type="text" 
                      className="w-full border rounded-md p-3 text-base focus:border-medical-500 outline-none" 
                      value={newPatientData.name}
                      onChange={e => setNewPatientData({...newPatientData, name: e.target.value})}
                    />
                 </div>
                 <div className="flex gap-4">
                   <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Idade</label>
                      <input 
                        required
                        type="number" 
                        min="0"
                        inputMode="numeric"
                        className="w-full border rounded-md p-3 text-base focus:border-medical-500 outline-none" 
                        value={newPatientData.age || ''}
                        onChange={e => setNewPatientData({...newPatientData, age: parseInt(e.target.value) || 0})}
                      />
                   </div>
                   <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gênero</label>
                      <select 
                        className="w-full border rounded-md p-3 text-base focus:border-medical-500 outline-none bg-white"
                        value={newPatientData.gender}
                        onChange={e => setNewPatientData({...newPatientData, gender: e.target.value as any})}
                      >
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                        <option value="Outro">Outro</option>
                      </select>
                   </div>
                 </div>
                 <div className="flex gap-4">
                   <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                      <input 
                        type="number" 
                        min="0"
                        step="0.1"
                        inputMode="decimal"
                        className="w-full border rounded-md p-3 text-base focus:border-medical-500 outline-none" 
                        value={newPatientData.estimatedWeight || ''}
                        onChange={e => setNewPatientData({...newPatientData, estimatedWeight: parseFloat(e.target.value) || 0})}
                      />
                   </div>
                   <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                      <select 
                        className="w-full border rounded-md p-3 text-base focus:border-medical-500 outline-none bg-white"
                        value={newPatientData.unit}
                        onChange={e => setNewPatientData({...newPatientData, unit: e.target.value as any})}
                      >
                        <option value="UTI">UTI</option>
                        <option value="Enfermaria">Enfermaria</option>
                      </select>
                   </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Leito</label>
                    <input 
                        required
                        type="text" 
                        placeholder="Ex: UTI-01"
                        className="w-full border rounded-md p-3 text-base focus:border-medical-500 outline-none" 
                        value={newPatientData.bedNumber}
                        onChange={e => setNewPatientData({...newPatientData, bedNumber: e.target.value})}
                      />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Admissão</label>
                    <input 
                      required
                      type="date" 
                      className="w-full border rounded-md p-3 text-base focus:border-medical-500 outline-none" 
                      value={newPatientData.admissionDate}
                      onChange={e => setNewPatientData({...newPatientData, admissionDate: e.target.value})}
                    />
                 </div>
                 <div className="pt-4 pb-2 mt-auto">
                    <button type="submit" className="w-full bg-medical-600 text-white py-3 rounded-md hover:bg-medical-700 font-medium text-lg">
                      {editingPatientId ? 'Salvar Alterações' : 'Cadastrar Paciente'}
                    </button>
                 </div>
              </form>
            </div>
          </div>
        )}

        {/* Transfer Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:hidden">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h3 className="text-md font-bold text-gray-900">Transferir Paciente</h3>
                <button onClick={() => setShowTransferModal(false)} className="text-gray-400 hover:text-gray-600 p-2">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                 <p className="text-sm text-gray-600">Selecione o setor de destino para <strong>{selectedPatient?.name}</strong>.</p>
                 
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
                    <select 
                      className="w-full border rounded-md p-3 text-base focus:border-medical-500 outline-none bg-white"
                      value={transferTarget}
                      onChange={e => setTransferTarget(e.target.value)}
                    >
                      <option value="UTI">UTI</option>
                      <option value="Enfermaria">Enfermaria</option>
                      <option value="Finalizados">Alta / Finalizado</option>
                    </select>
                 </div>
                 
                 <div className="pt-2 flex gap-3">
                    <button onClick={() => setShowTransferModal(false)} className="flex-1 px-3 py-3 border rounded-md text-gray-700 hover:bg-gray-50 text-sm">Cancelar</button>
                    <button onClick={handleTransferPatient} className="flex-1 px-3 py-3 bg-medical-600 text-white rounded-md hover:bg-medical-700 font-medium text-sm">
                      Confirmar
                    </button>
                 </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}