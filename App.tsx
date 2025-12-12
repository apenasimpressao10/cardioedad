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

// --- MOCK DATA INITIALIZATION ---
const MOCK_PATIENTS: Patient[] = [
  {
    id: '1',
    name: 'Roberto Silva',
    age: 64,
    gender: 'Masculino',
    estimatedWeight: 82,
    bedNumber: 'UTI-04',
    unit: 'UTI',
    status: 'active',
    admissionDate: '2023-10-20',
    admissionHistory: 'Paciente admitido via Pronto Socorro com quadro de dispneia progressiva aos médios esforços, associada a tosse produtiva e febre não aferida há 3 dias. Relata queda do estado geral e inapetência.',
    personalHistory: [
      'Hipertensão Arterial Sistêmica',
      'Diabetes Mellitus Tipo 2',
      'Ex-tabagista (20 anos/maço)'
    ],
    homeMedications: [
      'Losartana 50mg 12/12h',
      'Metformina 850mg 3x/dia',
      'AAS 100mg 1x/dia'
    ],
    medicalPrescription: '1. Dieta Branda Hipossódica para diabético\n2. Soro Fisiológico 0,9% 1000ml EV contínuo a 42ml/h\n3. Ceftriaxona 2g EV 1x/dia (D3/7)\n4. Azitromicina 500mg EV 1x/dia (D3/5)\n5. Omeprazol 40mg EV 1x/dia pela manhã\n6. Dipirona 1g EV 6/6h se Dor ou Febre\n7. Plasil 10mg EV 8/8h se Náusea\n8. Heparina 5000UI SC 12/12h\n9. Glicemia Capilar 6/6h + Insulina Regular conforme esquema',
    vasoactiveDrugs: 'Noradrenalina 0.15 mcg/kg/min (em desmame)',
    sedationAnalgesia: 'Precedex 0.4 mcg/kg/h',
    devices: 'CVC em VJD, PAM em Radial D, SNE para dieta',
    diagnosticHypotheses: [
      'Pneumonia Adquirida na Comunidade',
      'Lesão Renal Aguda',
      'Sepse de foco pulmonar'
    ],
    dailyLogs: [
      {
        id: '101',
        date: '2023-10-22',
        vitalSigns: { temperature: '38.5', heartRate: '92', respiratoryRate: '22', bloodPressureSys: '145', bloodPressureDia: '90', oxygenSaturation: '94', capillaryBloodGlucose: '180' },
        notes: 'Paciente febril durante a noite. Tosse produtiva notada. Apetite reduzido.',
        prescriptions: ['Ceftriaxona 2g IV diário', 'Azitromicina 500mg IV diário', 'Paracetamol 1g SN'],
        conducts: [
          { description: 'Raio-X de Tórax', verified: true }, 
          { description: 'Hemoculturas', verified: true }
        ],
        labs: [
            { testName: 'Leucócitos', value: '14.5', unit: 'x10^9/L', referenceRange: '4.0-11.0' },
            { testName: 'PCR', value: '120', unit: 'mg/L', referenceRange: '<5' },
            { testName: 'Creatinina', value: '110', unit: 'µmol/L', referenceRange: '60-110' }
        ],
        fluidBalance: { intake: 2500, output: 1800, net: 700 }
      },
      {
        id: '102',
        date: '2023-10-23',
        vitalSigns: { temperature: '37.8', heartRate: '88-92', respiratoryRate: '20', bloodPressureSys: '138', bloodPressureDia: '85', oxygenSaturation: '95', capillaryBloodGlucose: '145' },
        notes: 'Ligeira melhora na temperatura. SpO2 estável em cateter nasal a 2L.',
        prescriptions: ['Ceftriaxona 2g IV diário', 'Azitromicina 500mg IV diário', 'Enoxaparina 40mg SC diário'],
        conducts: [
          { description: 'Avaliação fisioterapêutica', verified: false }
        ],
        labs: [
            { testName: 'Leucócitos', value: '12.1', unit: 'x10^9/L', referenceRange: '4.0-11.0' },
            { testName: 'PCR', value: '98', unit: 'mg/L', referenceRange: '<5' },
            { testName: 'Creatinina', value: '105', unit: 'µmol/L', referenceRange: '60-110' }
        ],
        fluidBalance: { intake: 2200, output: 2400, net: -200 }
      },
      {
        id: '103',
        date: '2023-10-24',
        vitalSigns: { temperature: '36.5-37.0', heartRate: '75-80', respiratoryRate: '18', bloodPressureSys: '130', bloodPressureDia: '80', oxygenSaturation: '97-98', capillaryBloodGlucose: '110' },
        notes: 'Afebril hoje. Mobilizando-se para poltrona. Boa aceitação oral.',
        prescriptions: ['Ceftriaxona 2g IV diário', 'Azitromicina 500mg IV diário'],
        conducts: [
          { description: 'Repetir Raio-X de Tórax', verified: false }
        ],
        labs: [
            { testName: 'Leucócitos', value: '9.8', unit: 'x10^9/L', referenceRange: '4.0-11.0' },
            { testName: 'PCR', value: '45', unit: 'mg/L', referenceRange: '<5' },
            { testName: 'Creatinina', value: '95', unit: 'µmol/L', referenceRange: '60-110' }
        ],
        fluidBalance: { intake: 2000, output: 2100, net: -100 }
      }
    ],
    attachments: []
  },
  {
    id: '2',
    name: 'Helena Pereira',
    age: 78,
    gender: 'Feminino',
    estimatedWeight: 65,
    bedNumber: 'ENF-12',
    unit: 'Enfermaria',
    status: 'active',
    admissionDate: '2023-10-24',
    admissionHistory: 'Transferida da UPA com relato de dispneia paroxística noturna e ortopneia. Edema de MMII ++/4+.',
    personalHistory: ['Insuficiência Cardíaca (FE 35%)', 'Fibrilação Atrial Permanente', 'Hipotireoidismo'],
    homeMedications: ['Carvedilol 6.25mg 12/12h', 'Furosemida 40mg cedo', 'Levotiroxina 50mcg'],
    medicalPrescription: '1. Dieta Hipossódica com restrição hídrica (800ml/dia)\n2. Furosemida 40mg EV 12/12h\n3. Carvedilol 6.25mg VO 12/12h\n4. Levotiroxina 50mcg VO cedo (jejum)\n5. Enoxaparina 40mg SC 1x/dia',
    diagnosticHypotheses: [
      'Exacerbação de Insuficiência Cardíaca Congestiva',
      'Fibrilação Atrial de alta resposta'
    ],
    dailyLogs: [
        {
        id: '201',
        date: '2023-10-25',
        vitalSigns: { temperature: '36.2', heartRate: '88', respiratoryRate: '19', bloodPressureSys: '130', bloodPressureDia: '80', oxygenSaturation: '93', capillaryBloodGlucose: '98' },
        notes: 'Paciente estável, eupneica em ar ambiente. Diurese preservada após furosemida.',
        prescriptions: ['Furosemida 40mg EV 12/12h', 'Carvedilol 6.25mg VO 12/12h'],
        conducts: [
          { description: 'Solicitar Ecocardiograma', verified: false },
          { description: 'Ajuste de anticoagulação', verified: true }
        ],
        labs: [
            { testName: 'Creatinina', value: '1.2', unit: 'mg/dL', referenceRange: '0.6-1.1' },
            { testName: 'Potássio', value: '4.1', unit: 'mEq/L', referenceRange: '3.5-5.0' },
            { testName: 'BNP', value: '450', unit: 'pg/mL', referenceRange: '<100' }
        ]
      }
    ],
    attachments: []
  }
];

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
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
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
               // newestLogId is implicitly undefined, which evaluates to !undefined = true (Shown) in the render logic
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
    // collapsedLogs is handled above now
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

  const handleSavePatient = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPatientId) {
      // Update existing patient
      setPatients(prev => prev.map(p => {
        if (p.id === editingPatientId) {
          return {
            ...p,
            ...newPatientData,
            // Ensure fields that aren't in form are preserved
            personalHistory: p.personalHistory,
            homeMedications: p.homeMedications,
            diagnosticHypotheses: p.diagnosticHypotheses,
            dailyLogs: p.dailyLogs,
            vasoactiveDrugs: p.vasoactiveDrugs,
            sedationAnalgesia: p.sedationAnalgesia,
            devices: p.devices,
            attachments: p.attachments,
            id: p.id
          };
        }
        return p;
      }));
      setEditingPatientId(null);
    } else {
      // Create new patient
      const newPatient: Patient = {
        ...newPatientData,
        id: Math.random().toString(36).substr(2, 9),
        personalHistory: [],
        homeMedications: [],
        diagnosticHypotheses: [],
        dailyLogs: [],
        vasoactiveDrugs: '',
        sedationAnalgesia: '',
        devices: '',
        attachments: []
      };
      setPatients(prev => [...prev, newPatient]);
      setSelectedPatientId(newPatient.id);
      
      if (activeTab === 'Finalizados') {
         setActiveTab(newPatient.unit);
      } else if (activeTab !== newPatient.unit) {
         setActiveTab(newPatient.unit);
      }
    }
    
    setShowAddPatientModal(false);
    setNewPatientData(INITIAL_NEW_PATIENT_STATE);
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

  const handleTransferPatient = () => {
    if (!selectedPatientId) return;

    setPatients(prevPatients => prevPatients.map(p => {
      if (p.id === selectedPatientId) {
        if (transferTarget === 'Finalizados') {
          return { ...p, status: 'completed' };
        } else {
          return { ...p, status: 'active', unit: transferTarget as 'UTI' | 'Enfermaria' };
        }
      }
      return p;
    }));
    setShowTransferModal(false);
  };
  
  const handleSaveLog = (logData: Omit<DailyLog, 'id'>) => {
    if (!selectedPatientId) return;
    
    setPatients(prevPatients => {
      return prevPatients.map(p => {
        if (p.id === selectedPatientId) {
          // 1. Update Logs
          let updatedLogs;
          if (editingLog) {
            updatedLogs = p.dailyLogs.map(log => 
               log.id === editingLog.id ? { ...logData, id: editingLog.id } : log
            );
          } else {
            const newLog: DailyLog = {
              ...logData,
              id: Math.random().toString(36).substr(2, 9),
            };
            updatedLogs = [...p.dailyLogs, newLog];
          }

          // 2. Sync Prescription (Update main patient prescription from this log)
          const newPrescriptionText = logData.prescriptions
            .filter(line => line.trim().length > 0)
            .map((line, idx) => `${idx + 1}. ${line}`)
            .join('\n');

          return { 
            ...p, 
            dailyLogs: updatedLogs,
            medicalPrescription: newPrescriptionText // Automatically updates the main prescription field
          };
        }
        return p;
      });
    });

    setShowAddLogModal(false);
    setEditingLog(null);
  };

  const handleEditLog = (log: DailyLog) => {
    setEditingLog(log);
    setShowAddLogModal(true);
  };

  const handleToggleConductVerification = (logId: string, conductIndex: number) => {
    if (!selectedPatientId) return;
    
    setPatients(prevPatients => {
      return prevPatients.map(p => {
        if (p.id === selectedPatientId) {
          const updatedLogs = p.dailyLogs.map(log => {
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
          return { ...p, dailyLogs: updatedLogs };
        }
        return p;
      });
    });
  };

  const handleUpdateLabResult = (logId: string, testName: string, newValue: string, unit?: string) => {
    const updatedPatients = patients.map(p => {
      if (p.id === selectedPatientId) {
        const updatedLogs = p.dailyLogs.map(log => {
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
               const referenceLab = p.dailyLogs
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
        return { ...p, dailyLogs: updatedLogs };
      }
      return p;
    });
    setPatients(updatedPatients);
  };

  const updatePatientList = (field: 'diagnosticHypotheses' | 'personalHistory' | 'homeMedications', value: string, action: 'add' | 'remove', index?: number) => {
    const updatedPatients = patients.map(p => {
      if (p.id === selectedPatientId) {
        let newList = [...p[field]];
        if (action === 'add') {
           if(value.trim()) newList.push(value);
        } else if (action === 'remove' && index !== undefined) {
           newList.splice(index, 1);
        }
        return { ...p, [field]: newList };
      }
      return p;
    });
    setPatients(updatedPatients);
  };

  const updateHypothesesList = (newHypotheses: string[]) => {
    const updatedPatients = patients.map(p => {
      if (p.id === selectedPatientId) {
        return { ...p, diagnosticHypotheses: newHypotheses };
      }
      return p;
    });
    setPatients(updatedPatients);
  };

  const saveAdmissionHistory = () => {
    const updatedPatients = patients.map(p => {
      if (p.id === selectedPatientId) {
        return { ...p, admissionHistory: tempAdmissionHistory };
      }
      return p;
    });
    setPatients(updatedPatients);
    setEditingAdmission(false);
  };

  const savePrescription = () => {
    const updatedPatients = patients.map(p => {
      if (p.id === selectedPatientId) {
        return { ...p, medicalPrescription: tempPrescription };
      }
      return p;
    });
    setPatients(updatedPatients);
    setEditingPrescription(false);
  };

  const saveICUDetails = () => {
     const updatedPatients = patients.map(p => {
      if (p.id === selectedPatientId) {
        return { 
            ...p, 
            vasoactiveDrugs: tempVasoactive,
            sedationAnalgesia: tempSedation,
            devices: tempDevices
        };
      }
      return p;
    });
    setPatients(updatedPatients);
    setEditingICUDetails(false);
  }

  // --- ATTACHMENT HANDLERS ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0] && selectedPatientId) {
      const file = event.target.files[0];
      const isImage = file.type.startsWith('image/');
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const newAttachment: Attachment = {
             id: Math.random().toString(36).substr(2, 9),
             name: file.name,
             type: isImage ? 'image' : 'file',
             url: e.target.result as string, // Base64
             date: new Date().toISOString()
          };
          
          setPatients(prev => prev.map(p => {
             if (p.id === selectedPatientId) {
                return { ...p, attachments: [...p.attachments, newAttachment] };
             }
             return p;
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAttachment = (attachmentId: string) => {
     if (!selectedPatientId) return;
     if (window.confirm('Tem certeza que deseja excluir este anexo?')) {
        setPatients(prev => prev.map(p => {
            if (p.id === selectedPatientId) {
               return { ...p, attachments: p.attachments.filter(a => a.id !== attachmentId) };
            }
            return p;
        }));
     }
  };

  // Calculate Cumulative Fluid Balance
  const cumulativeFluidBalance = selectedPatient?.dailyLogs.reduce((acc, log) => {
    return acc + (log.fluidBalance?.net || 0);
  }, 0) || 0;

  // Toggle strikethrough for a specific line in the prescription
  const handleTogglePrescriptionLine = (index: number) => {
    if (!selectedPatient) return;
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
    
    // Also update temp prescription if currently editing, though clicking is disabled while editing
    if (editingPrescription) {
        setTempPrescription(newText);
    }
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
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm border border-slate-700">
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
                  className={`w-full bg-slate-50 border rounded-lg p-3 pl-10 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${loginError ? 'border-red-300 focus:ring-red-200' : 'border-slate-300 focus:border-medical-500 focus:ring-medical-200'}`}
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

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className={`print:hidden ${isSidebarOpen ? 'w-80' : 'w-0'} bg-slate-900 text-white transition-all duration-300 flex flex-col overflow-hidden shadow-xl z-20`}>
        <div className="p-6 border-b border-slate-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
             <Activity className="text-medical-500" size={28} />
             <h1 className="text-xl font-bold tracking-tight">CardioEDAD</h1>
          </div>
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
                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 py-2 rounded-lg text-sm transition-colors"
                title="Adicionar Paciente"
             >
                <UserPlus size={16} /> Adicionar
             </button>
             <button
               onClick={() => setShowBulkPrintPreview(true)}
               disabled={filteredPatients.length === 0}
               className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 py-2 px-3 rounded-lg text-sm transition-colors disabled:opacity-50"
               title={`Imprimir Lista da ${activeTab}`}
             >
                <Printer size={16} />
             </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          {filteredPatients.length === 0 && (
             <div className="text-center text-slate-500 text-sm mt-10 p-4">
                Nenhum paciente {activeTab === 'Finalizados' ? 'finalizado' : `na ${activeTab}`}.
             </div>
          )}
          {filteredPatients.map(patient => (
            <div 
              key={patient.id}
              onClick={() => setSelectedPatientId(patient.id)}
              className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors group ${selectedPatientId === patient.id ? 'bg-medical-600' : 'hover:bg-slate-800'}`}
            >
              <div className="flex justify-between items-start">
                <span className="font-medium text-slate-100">{patient.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${selectedPatientId === patient.id ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'}`}>
                  {patient.bedNumber}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1 flex gap-2">
                 <span>{patient.gender}</span> • <span>{patient.age} anos</span>
                 {activeTab === 'Finalizados' && <span className="text-medical-400 ml-auto">{patient.unit}</span>}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-slate-700">
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-900/30 text-slate-300 hover:text-red-200 border border-slate-700 hover:border-red-800/50 py-2 rounded-lg transition-all text-sm mb-4"
          >
            <LogOut size={16} /> Sair do Sistema
          </button>
          <div className="text-xs text-slate-500 text-center">
             v1.2.3 • Ambiente Seguro
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {selectedPatient ? (
            <>
                {/* Header */}
                <header className="print:hidden bg-white border-b h-16 flex items-center justify-between px-6 shadow-sm z-10 shrink-0">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 rounded-md text-gray-600">
                       {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                    <div>
                      <div className="flex items-baseline gap-2">
                          <h2 className="text-lg font-bold text-gray-900">{selectedPatient.name}</h2>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${selectedPatient.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600'}`}>
                            {selectedPatient.status === 'completed' ? 'Alta/Finalizado' : selectedPatient.unit}
                          </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><BedDouble size={14} /> {selectedPatient.bedNumber}</span>
                        <span className="flex items-center gap-1"><Calendar size={14} /> Admissão: {new Date(selectedPatient.admissionDate).toLocaleDateString('pt-BR')}</span>
                        {/* New Weight Display */}
                        <span className="flex items-center gap-1"><Scale size={14} /> {selectedPatient.estimatedWeight ? `${selectedPatient.estimatedWeight}kg` : 'Peso NR'}</span>
                        
                        <button onClick={startEditingPatient} className="flex items-center gap-1 text-medical-600 hover:text-medical-800 hover:underline ml-2">
                           <Pencil size={12} /> Editar Dados
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
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
                        className="flex items-center gap-2 bg-medical-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow hover:bg-medical-700 transition-colors"
                        >
                        <PlusCircle size={16} /> Novo Registro
                        </button>
                    )}
                  </div>
                </header>

                {/* Pending Conducts Bar - Compact (All open items) */}
                {allPendingConducts.length > 0 && (
                  <div className="bg-orange-50 border-b border-orange-100 px-6 py-2 flex items-start sm:items-center gap-3 text-xs sm:text-sm text-orange-800 print:hidden transition-all">
                     <div className="flex items-center gap-1 font-bold shrink-0">
                        <ListTodo size={16} className="text-orange-600"/>
                        <span>Pendências:</span>
                     </div>
                     <div className="flex-1 flex flex-wrap gap-x-4 gap-y-1">
                        {allPendingConducts.map((item, i) => (
                           <span key={i} className="flex items-center gap-1" title={`${new Date(item.date).toLocaleDateString('pt-BR')} - ${item.description}`}>
                             <span className="text-[10px] font-semibold text-orange-600/70 bg-orange-100 px-1 rounded">
                                {new Date(item.date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}
                             </span>
                             <span className="truncate max-w-[200px]">{item.description}</span>
                           </span>
                        ))}
                     </div>
                  </div>
                )}

                {/* Scrollable Dashboard */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 print:hidden">
                  
                  {/* Clinical Context Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Card 1: Admission History */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col transition-all">
                       <div 
                         className="flex items-center justify-between mb-4 border-b pb-2 cursor-pointer"
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
                               className="text-xs text-medical-600 hover:text-medical-800 font-medium z-10"
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
                               className="w-full h-full min-h-[150px] p-2 text-sm border rounded-md focus:border-medical-500 outline-none resize-none bg-gray-50"
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
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col transition-all">
                       <div 
                         className="flex items-center justify-between mb-4 border-b pb-2 cursor-pointer"
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
                                <ul className="space-y-1 mb-2">
                                {selectedPatient.personalHistory.map((item, i) => (
                                    <li key={i} className="flex justify-between items-start text-sm text-gray-700 group hover:bg-gray-50 rounded px-1 -mx-1">
                                    <span className="flex-1 flex gap-2"><span className="text-gray-400">•</span> {item}</span>
                                    <button onClick={() => updatePatientList('personalHistory', '', 'remove', i)} className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100"><X size={14}/></button>
                                    </li>
                                ))}
                                </ul>
                                <div className="flex gap-2 mt-auto">
                                <input type="text" value={newPersonalHistory} onChange={e => setNewPersonalHistory(e.target.value)} onKeyDown={e => e.key === 'Enter' && (updatePatientList('personalHistory', newPersonalHistory, 'add'), setNewPersonalHistory(''))} placeholder="Adicionar antecedente..." className="flex-1 text-xs border rounded px-2 py-1 outline-none focus:border-medical-500"/>
                                <button onClick={() => {updatePatientList('personalHistory', newPersonalHistory, 'add'); setNewPersonalHistory('')}} className="bg-gray-100 text-gray-600 px-2 rounded text-xs"><PlusCircle size={14}/></button>
                                </div>
                            </div>

                            <div className="border-t pt-4 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 mb-2 text-gray-800 font-semibold text-sm">
                                <Pill size={16} className="text-medical-600"/>
                                <h3>Medicamentos de Uso Contínuo</h3>
                                </div>
                                <ul className="space-y-1 mb-2">
                                {selectedPatient.homeMedications.map((item, i) => (
                                    <li key={i} className="flex justify-between items-start text-sm text-gray-700 group hover:bg-gray-50 rounded px-1 -mx-1">
                                    <span className="flex-1 flex gap-2"><span className="text-gray-400">•</span> {item}</span>
                                    <button onClick={() => updatePatientList('homeMedications', '', 'remove', i)} className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100"><X size={14}/></button>
                                    </li>
                                ))}
                                </ul>
                                <div className="flex gap-2 mt-auto">
                                <input type="text" value={newHomeMed} onChange={e => setNewHomeMed(e.target.value)} onKeyDown={e => e.key === 'Enter' && (updatePatientList('homeMedications', newHomeMed, 'add'), setNewHomeMed(''))} placeholder="Adicionar medicamento..." className="flex-1 text-xs border rounded px-2 py-1 outline-none focus:border-medical-500"/>
                                <button onClick={() => {updatePatientList('homeMedications', newHomeMed, 'add'); setNewHomeMed('')}} className="bg-gray-100 text-gray-600 px-2 rounded text-xs"><PlusCircle size={14}/></button>
                                </div>
                            </div>
                         </div>
                       )}
                    </div>

                    {/* Card 3: Diagnostic Hypothesis */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col transition-all">
                       <div 
                         className="flex items-center justify-between mb-4 border-b pb-2 cursor-pointer"
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
                                        className="flex-1 border rounded px-2 py-1 outline-none focus:border-medical-500 text-sm"
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
                                     }} className="text-green-600 hover:bg-green-50 p-1.5 rounded" title="Salvar">
                                         <Check size={16}/>
                                     </button>
                                     <button onClick={(e) => { e.stopPropagation(); setEditingDiagnosisIndex(null); }} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded" title="Cancelar">
                                         <X size={16}/>
                                     </button>
                                   </li>
                                 );
                               }

                               // -- VIEW MODE --
                               return (
                                 <li key={i} className="flex items-start gap-2 text-sm text-gray-700 group min-h-[28px]">
                                    <span className="mt-2 w-1.5 h-1.5 bg-medical-500 rounded-full shrink-0"></span>
                                    <span className="flex-1 pt-0.5">{dx}</span>
                                    
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingDiagnosisIndex(i);
                                              setTempDiagnosisValue(dx);
                                          }} 
                                          className="text-gray-400 hover:text-medical-600 hover:bg-gray-100 p-1 rounded" title="Editar"
                                        >
                                          <Pencil size={14}/>
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
                                              className={`text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded ${i === 0 ? 'invisible' : ''}`}
                                              title="Mover para cima"
                                            >
                                              <ArrowUp size={14}/>
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
                                              className={`text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded ${i === selectedPatient.diagnosticHypotheses.length - 1 ? 'invisible' : ''}`}
                                              title="Mover para baixo"
                                            >
                                              <ArrowDown size={14}/>
                                            </button>
                                        </div>

                                        <button 
                                          onClick={(e) => { e.stopPropagation(); updatePatientList('diagnosticHypotheses', '', 'remove', i); }} 
                                          className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1 rounded ml-1" title="Remover"
                                        >
                                          <X size={14}/>
                                        </button>
                                    </div>
                                 </li>
                               );
                             })}
                             {selectedPatient.diagnosticHypotheses.length === 0 && <li className="text-sm text-gray-400 italic">Nenhum diagnóstico registrado.</li>}
                           </ul>
                           <div className="flex gap-2 mt-auto">
                             <input 
                               type="text" 
                               value={newDiagnosis}
                               onChange={(e) => setNewDiagnosis(e.target.value)}
                               onKeyDown={(e) => e.key === 'Enter' && (updatePatientList('diagnosticHypotheses', newDiagnosis, 'add'), setNewDiagnosis(''))}
                               placeholder="Adicionar hipótese..." 
                               className="flex-1 text-sm border rounded-md px-3 py-1.5 focus:border-medical-500 outline-none"
                             />
                             <button onClick={() => {updatePatientList('diagnosticHypotheses', newDiagnosis, 'add'); setNewDiagnosis('')}} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 rounded-md text-sm font-medium">Adicionar</button>
                           </div>
                         </div>
                       )}
                    </div>

                  </div>

                  {/* Lab Results Table */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 transition-all">
                     <div 
                       className="flex items-center justify-between mb-4 cursor-pointer"
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
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col transition-all">
                       <div 
                         className="flex items-center justify-between mb-4 border-b pb-2 cursor-pointer"
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
                               className="text-xs text-medical-600 hover:text-medical-800 font-medium z-10"
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
                               className="w-full h-full min-h-[200px] p-2 text-sm border rounded-md focus:border-medical-500 outline-none resize-y bg-gray-50"
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
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col transition-all">
                       <div 
                         className="flex items-center justify-between mb-4 border-b pb-2 cursor-pointer"
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
                               className="text-xs text-medical-600 hover:text-medical-800 font-medium z-10"
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
                                    className="w-full h-24 p-2 text-sm border rounded bg-gray-50 focus:border-medical-500 outline-none resize-none"
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
                                    className="w-full h-24 p-2 text-sm border rounded bg-gray-50 focus:border-medical-500 outline-none resize-none"
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
                                    className="w-full h-24 p-2 text-sm border rounded bg-gray-50 focus:border-medical-500 outline-none resize-none"
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
                       className="flex items-center gap-2 cursor-pointer"
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
                                className="bg-gray-50 px-5 py-3 border-b flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => toggleLogSection(log.id)}
                              >
                                <div className="flex items-center gap-2">
                                  {collapsedLogs[log.id] ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronUp size={18} className="text-gray-400" />}
                                  <span className="font-semibold text-gray-900">{new Date(log.date).toLocaleDateString('pt-BR', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</span>
                                </div>
                                <div className="flex items-center gap-4 relative z-10">
                                    {/* Fluid Balance Badge in Log Header (If present) */}
                                    {log.fluidBalance && (
                                      <div className={`text-xs font-bold px-2 py-1 rounded border flex items-center gap-1 ${log.fluidBalance.net > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                        <Droplets size={12}/>
                                        BH: {log.fluidBalance.net > 0 ? '+' : ''}{log.fluidBalance.net}ml
                                      </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <button 
                                          type="button" 
                                          onClick={(e) => { e.stopPropagation(); handleEditLog(log); }} 
                                          className="p-1.5 text-gray-400 hover:text-medical-600 hover:bg-gray-100 rounded-md transition-colors relative z-20" 
                                          title="Editar Registro"
                                        >
                                          <Pencil size={16} />
                                        </button>
                                        
                                    </div>
                                </div>
                              </div>
                              
                              {!collapsedLogs[log.id] && (
                                <div className="p-5 space-y-4">
                                  
                                  {/* Vitals Snapshot */}
                                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center bg-blue-50/50 p-3 rounded-lg">
                                    <div><div className="text-[10px] uppercase text-gray-500">Temp</div><div className={`font-bold ${getTemperatureStyle(log.vitalSigns.temperature)}`}>{log.vitalSigns.temperature}°</div></div>
                                    <div><div className="text-[10px] uppercase text-gray-500">FC</div><div className="font-bold text-gray-800">{log.vitalSigns.heartRate}</div></div>
                                    <div><div className="text-[10px] uppercase text-gray-500">FR</div><div className="font-bold text-gray-800">{log.vitalSigns.respiratoryRate}</div></div>
                                    <div><div className="text-[10px] uppercase text-gray-500">PA</div><div className="font-bold text-gray-800">{log.vitalSigns.bloodPressureSys}/{log.vitalSigns.bloodPressureDia}</div></div>
                                    <div><div className="text-[10px] uppercase text-gray-500">SpO2</div><div className="font-bold text-gray-800">{log.vitalSigns.oxygenSaturation}%</div></div>
                                    <div><div className="text-[10px] uppercase text-gray-500">Glicemia</div><div className="font-bold text-gray-800">{log.vitalSigns.capillaryBloodGlucose || '-'}</div></div>
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
                                        <ul className="text-sm space-y-1">
                                          {log.conducts.map((conduct, i) => (
                                            <li key={i} className="flex gap-2 items-start text-gray-700 group/conduct">
                                              <button 
                                                  onClick={() => handleToggleConductVerification(log.id, i)}
                                                  className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${conduct.verified ? 'bg-green-100 border-green-500 text-green-600' : 'border-gray-300 bg-white hover:border-medical-500'}`}
                                                  title={conduct.verified ? "Desmarcar" : "Marcar como realizado"}
                                              >
                                                  {conduct.verified && <Check size={10} />}
                                              </button>
                                              <span 
                                                onClick={() => handleToggleConductVerification(log.id, i)}
                                                className={`cursor-pointer transition-colors ${conduct.verified ? 'text-gray-500 line-through decoration-gray-400/50' : 'group-hover/conduct:text-medical-700'}`}
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
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col transition-all pb-10">
                     <div 
                         className="flex items-center justify-between mb-4 border-b pb-2 cursor-pointer"
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
                                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
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
                                            className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                            title="Excluir"
                                         >
                                            <Trash2 size={14} />
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
                                              className="text-[10px] text-medical-600 hover:underline flex items-center gap-1 mt-1"
                                            >
                                               <Download size={10} /> Baixar
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
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 print:hidden">
               <div className="bg-gray-200 p-4 rounded-full mb-4">
                 <Activity size={48} className="text-gray-400" />
               </div>
               <h2 className="text-xl font-semibold text-gray-600 mb-2">Bem-vindo ao CardioEDAD</h2>
               <p className="max-w-md text-center text-sm">Selecione um paciente da {activeTab} no menu lateral para visualizar ou adicionar novos registros.</p>
               <button onClick={() => setIsSidebarOpen(true)} className="mt-6 text-medical-600 hover:text-medical-800 font-medium md:hidden">Abrir Menu</button>
            </div>
        )}

        {/* Modal for New Log */}
        {showAddLogModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:hidden">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-lg font-bold text-gray-900">{editingLog ? 'Editar Registro Diário' : 'Adicionar Registro Diário'}</h3>
                <button onClick={() => { setShowAddLogModal(false); setEditingLog(null); }} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6">
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
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:hidden">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex justify-between items-center bg-white">
                <h3 className="text-lg font-bold text-gray-900">{editingPatientId ? 'Editar Paciente' : 'Novo Paciente'}</h3>
                <button onClick={() => setShowAddPatientModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSavePatient} className="p-6 space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                    <input 
                      required
                      type="text" 
                      className="w-full border rounded-md p-2 focus:border-medical-500 outline-none" 
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
                        className="w-full border rounded-md p-2 focus:border-medical-500 outline-none" 
                        value={newPatientData.age || ''}
                        onChange={e => setNewPatientData({...newPatientData, age: parseInt(e.target.value) || 0})}
                      />
                   </div>
                   <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gênero</label>
                      <select 
                        className="w-full border rounded-md p-2 focus:border-medical-500 outline-none"
                        value={newPatientData.gender}
                        onChange={e => setNewPatientData({...newPatientData, gender: e.target.value as any})}
                      >
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                        <option value="Outro">Outro</option>
                      </select>
                   </div>
                   <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                      <input 
                        type="number" 
                        min="0"
                        step="0.1"
                        className="w-full border rounded-md p-2 focus:border-medical-500 outline-none" 
                        value={newPatientData.estimatedWeight || ''}
                        onChange={e => setNewPatientData({...newPatientData, estimatedWeight: parseFloat(e.target.value) || 0})}
                      />
                   </div>
                 </div>
                 <div className="flex gap-4">
                   <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                      <select 
                        className="w-full border rounded-md p-2 focus:border-medical-500 outline-none"
                        value={newPatientData.unit}
                        onChange={e => setNewPatientData({...newPatientData, unit: e.target.value as any})}
                      >
                        <option value="UTI">UTI</option>
                        <option value="Enfermaria">Enfermaria</option>
                      </select>
                   </div>
                   <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Leito</label>
                      <input 
                        required
                        type="text" 
                        placeholder="Ex: UTI-01"
                        className="w-full border rounded-md p-2 focus:border-medical-500 outline-none" 
                        value={newPatientData.bedNumber}
                        onChange={e => setNewPatientData({...newPatientData, bedNumber: e.target.value})}
                      />
                   </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Admissão</label>
                    <input 
                      required
                      type="date" 
                      className="w-full border rounded-md p-2 focus:border-medical-500 outline-none" 
                      value={newPatientData.admissionDate}
                      onChange={e => setNewPatientData({...newPatientData, admissionDate: e.target.value})}
                    />
                 </div>
                 <div className="pt-2">
                    <button type="submit" className="w-full bg-medical-600 text-white py-2 rounded-md hover:bg-medical-700 font-medium">
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
                <button onClick={() => setShowTransferModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                 <p className="text-sm text-gray-600">Selecione o setor de destino para <strong>{selectedPatient?.name}</strong>.</p>
                 
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
                    <select 
                      className="w-full border rounded-md p-2 focus:border-medical-500 outline-none"
                      value={transferTarget}
                      onChange={e => setTransferTarget(e.target.value)}
                    >
                      <option value="UTI">UTI</option>
                      <option value="Enfermaria">Enfermaria</option>
                      <option value="Finalizados">Alta / Finalizado</option>
                    </select>
                 </div>
                 
                 <div className="pt-2 flex gap-3">
                    <button onClick={() => setShowTransferModal(false)} className="flex-1 px-3 py-2 border rounded-md text-gray-700 hover:bg-gray-50 text-sm">Cancelar</button>
                    <button onClick={handleTransferPatient} className="flex-1 px-3 py-2 bg-medical-600 text-white rounded-md hover:bg-medical-700 font-medium text-sm">
                      Confirmar
                    </button>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* Individual Print Preview Modal */}
        {showPrintPreview && selectedPatient && (
          <div className="fixed inset-0 bg-gray-900/50 z-[100] flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
             <div className="bg-white w-full max-w-4xl h-[90vh] overflow-y-auto shadow-2xl rounded-xl print:shadow-none print:w-full print:h-auto print:rounded-none">
                 
                 {/* Print Controls - Hidden on Print */}
                 <div className="bg-gray-100 p-4 border-b flex justify-between items-center sticky top-0 print:hidden">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                       <Printer size={20} /> Visualização de Impressão
                    </h3>
                    <div className="flex gap-2">
                       <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
                          Imprimir
                       </button>
                       <button onClick={() => setShowPrintPreview(false)} className="bg-white hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium border transition-colors">
                          Fechar
                       </button>
                    </div>
                 </div>

                 {/* Printable Content */}
                 <div className="p-10 print:p-0 print:m-0 max-w-[210mm] mx-auto print:max-w-none">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between border-b-2 border-gray-800 pb-4 mb-6">
                       <div className="flex items-center gap-3">
                          <Activity className="text-gray-800" size={32} />
                          <div>
                             <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">CardioEDAD</h1>
                             <p className="text-xs text-gray-500 uppercase">Sistema de Monitoramento Clínico</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <h2 className="text-lg font-bold text-gray-800">RESUMO DE PRONTUÁRIO</h2>
                          <p className="text-sm text-gray-600">Data: {new Date().toLocaleDateString('pt-BR')}</p>
                       </div>
                    </div>

                    {/* Patient ID */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 print:border-gray-300">
                       <h3 className="text-sm font-bold text-gray-500 uppercase mb-2 border-b border-gray-200 pb-1">Identificação do Paciente</h3>
                       <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <p><span className="font-semibold text-gray-700">Nome:</span> {selectedPatient.name}</p>
                          <p><span className="font-semibold text-gray-700">Idade/Gênero:</span> {selectedPatient.age} anos / {selectedPatient.gender}</p>
                          <p><span className="font-semibold text-gray-700">Unidade/Leito:</span> {selectedPatient.unit} - {selectedPatient.bedNumber}</p>
                          <p><span className="font-semibold text-gray-700">Admissão:</span> {new Date(selectedPatient.admissionDate).toLocaleDateString('pt-BR')}</p>
                          <p><span className="font-semibold text-gray-700">Peso Estimado:</span> {selectedPatient.estimatedWeight ? `${selectedPatient.estimatedWeight} kg` : 'N/R'}</p>
                       </div>
                    </div>

                    {/* Diagnostic Hypotheses */}
                    <div className="mb-6">
                       <h3 className="text-md font-bold text-gray-800 uppercase border-b-2 border-gray-200 pb-1 mb-3">Hipóteses Diagnósticas</h3>
                       <ul className="list-disc list-inside space-y-1">
                          {selectedPatient.diagnosticHypotheses.length > 0 ? (
                             selectedPatient.diagnosticHypotheses.map((dx, i) => (
                                <li key={i} className="text-gray-800">{dx}</li>
                             ))
                          ) : (
                             <li className="text-gray-400 italic">Não registradas.</li>
                          )}
                       </ul>
                    </div>

                    {/* 48h Lab Comparison */}
                    <div className="mb-6">
                       <h3 className="text-md font-bold text-gray-800 uppercase border-b-2 border-gray-200 pb-1 mb-3">Evolução Laboratorial (48h)</h3>
                       {(() => {
                          // Logic to retrieve last 2 logs for comparison
                          const recentLogs = [...selectedPatient.dailyLogs]
                             .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                             .slice(0, 2)
                             .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                          
                          if (recentLogs.length === 0) return <p className="text-gray-500 italic text-sm">Sem registros laboratoriais recentes.</p>;

                          // Collect all unique test names from these logs
                          const allLabNames = Array.from(new Set(recentLogs.flatMap(l => l.labs.map(lab => lab.testName)))).sort();

                          return (
                             <div className="overflow-hidden border border-gray-300 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-300 text-sm">
                                   <thead className="bg-gray-100 print:bg-gray-200">
                                      <tr>
                                         <th className="px-3 py-2 text-left font-bold text-gray-700 w-1/3">Exame</th>
                                         {recentLogs.map(log => (
                                            <th key={log.id} className="px-3 py-2 text-center font-bold text-gray-700">
                                               {new Date(log.date).toLocaleDateString('pt-BR')}
                                            </th>
                                         ))}
                                      </tr>
                                   </thead>
                                   <tbody className="divide-y divide-gray-200 bg-white">
                                      {allLabNames.map(testName => (
                                         <tr key={testName}>
                                            <td className="px-3 py-1.5 font-medium text-gray-900 border-r border-gray-100">{testName}</td>
                                            {recentLogs.map(log => {
                                               const result = log.labs.find(l => l.testName === testName);
                                               return (
                                                  <td key={log.id} className="px-3 py-1.5 text-center text-gray-800">
                                                     {result ? `${result.value} ${result.unit}` : '-'}
                                                  </td>
                                               );
                                            })}
                                         </tr>
                                      ))}
                                   </tbody>
                                </table>
                             </div>
                          );
                       })()}
                    </div>

                    {/* Current Prescription */}
                    <div className="mb-8">
                       <h3 className="text-md font-bold text-gray-800 uppercase border-b-2 border-gray-200 pb-1 mb-3">Prescrição Médica Atual</h3>
                       <div className="bg-white border border-gray-200 p-4 rounded-lg text-sm leading-relaxed print:border-gray-300">
                          {selectedPatient.medicalPrescription ? (
                              <div className="columns-1 md:columns-2 gap-x-6 space-y-1">
                                {selectedPatient.medicalPrescription.split('\n').map((line, idx) => {
                                    if (!line.trim()) return null;
                                    const isStruck = line.startsWith('~~');
                                    const displayText = isStruck ? line.substring(2) : line;
                                    return (
                                        <div key={idx} className={`break-inside-avoid ${isStruck ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                            {displayText}
                                        </div>
                                    );
                                })}
                              </div>
                          ) : (
                              "Nenhuma prescrição ativa."
                          )}
                       </div>
                    </div>

                    {/* ICU Details (If Applicable) */}
                    {selectedPatient.unit === 'UTI' && (
                       <div className="mb-8 border border-gray-200 rounded-lg p-4 bg-gray-50 print:border-gray-300">
                          <h3 className="text-sm font-bold text-gray-700 uppercase mb-2 border-b border-gray-200 pb-1">Suporte Intensivo</h3>
                          <div className="grid grid-cols-3 gap-4 text-xs">
                             <div>
                                <strong className="block text-gray-500 uppercase mb-1">Drogas Vasoativas</strong>
                                <p className="text-gray-800">{selectedPatient.vasoactiveDrugs || '-'}</p>
                             </div>
                             <div>
                                <strong className="block text-gray-500 uppercase mb-1">Sedoanalgesia</strong>
                                <p className="text-gray-800">{selectedPatient.sedationAnalgesia || '-'}</p>
                             </div>
                             <div>
                                <strong className="block text-gray-500 uppercase mb-1">Dispositivos</strong>
                                <p className="text-gray-800">{selectedPatient.devices || '-'}</p>
                             </div>
                             <div>
                                <strong className="block text-gray-500 uppercase mb-1">Balanço Hídrico Acumulado</strong>
                                <p className="text-gray-800">{cumulativeFluidBalance > 0 ? '+' : ''}{cumulativeFluidBalance} ml</p>
                             </div>
                          </div>
                       </div>
                    )}

                    {/* Signature */}
                    <div className="mt-16 pt-8 border-t border-gray-300 flex justify-end">
                       <div className="text-center w-64">
                          <div className="border-t border-gray-800 mb-2"></div>
                          <p className="font-bold text-gray-800">Assinatura / Carimbo</p>
                          <p className="text-xs text-gray-500">Médico Responsável</p>
                       </div>
                    </div>

                 </div>
             </div>
          </div>
        )}

        {/* Bulk Print Preview Modal (General Unit Report) */}
        {showBulkPrintPreview && (
          <div className="fixed inset-0 bg-gray-900/50 z-[100] flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
             <div className="bg-white w-full max-w-7xl h-[95vh] overflow-y-auto shadow-2xl rounded-xl print:shadow-none print:w-full print:h-auto print:rounded-none">
                 
                 {/* Print Controls - Hidden on Print */}
                 <div className="bg-gray-100 p-4 border-b flex justify-between items-center sticky top-0 print:hidden z-50">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                       <FileBarChart size={20} /> Relatório Geral - {activeTab}
                    </h3>
                    <div className="flex gap-2">
                       <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
                          Imprimir Relatório
                       </button>
                       <button onClick={() => setShowBulkPrintPreview(false)} className="bg-white hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium border transition-colors">
                          Fechar
                       </button>
                    </div>
                 </div>

                 {/* Bulk Content */}
                 <div className="p-8 print:p-0 print:m-0">
                    
                    {/* Report Header */}
                    <div className="border-b-2 border-gray-800 pb-4 mb-6 print:mb-4">
                       <div className="flex items-center justify-between">
                          <div>
                             <h1 className="text-2xl font-bold text-gray-900 uppercase">CardioEDAD - Relatório da Unidade</h1>
                             <p className="text-sm text-gray-600 uppercase">Lista de Pacientes - {activeTab}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-sm text-gray-600">Data: {new Date().toLocaleDateString('pt-BR')}</p>
                             <p className="text-xs text-gray-500">Total de Pacientes: {filteredPatients.length}</p>
                          </div>
                       </div>
                    </div>

                    {/* Patient Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4 print:block">
                       {filteredPatients.map(patient => (
                          <div key={patient.id} className="border border-gray-300 rounded-lg p-3 bg-white break-inside-avoid mb-4 shadow-sm print:shadow-none print:mb-4 print:inline-block print:w-[48%] print:align-top print:mr-[1%]">
                             
                             {/* Patient Header */}
                             <div className="border-b border-gray-200 pb-2 mb-2 bg-gray-50 -m-3 mb-2 p-3 rounded-t-lg print:bg-gray-100">
                                <div className="flex justify-between items-start">
                                   <div>
                                     <h3 className="font-bold text-gray-900 text-sm uppercase">{patient.name}</h3>
                                     <p className="text-[10px] text-gray-600">Leito: {patient.bedNumber} | {patient.age}a | {patient.gender.charAt(0)} | {patient.estimatedWeight ? patient.estimatedWeight + 'kg' : 'Peso NR'}</p>
                                   </div>
                                   <div className="text-right">
                                     <p className="text-[10px] text-gray-500">Adm: {new Date(patient.admissionDate).toLocaleDateString('pt-BR')}</p>
                                   </div>
                                </div>
                             </div>

                             {/* Diagnósticos */}
                             <div className="mb-2">
                                <strong className="text-[10px] text-gray-500 uppercase block">Hipóteses:</strong>
                                <p className="text-[10px] font-medium text-gray-800 leading-tight">
                                   {patient.diagnosticHypotheses.length > 0 ? patient.diagnosticHypotheses.join(', ') : '-'}
                                </p>
                             </div>

                             {/* Labs Compact */}
                             <div className="mb-2">
                                <strong className="text-[10px] text-gray-500 uppercase block mb-1">Labs (48h):</strong>
                                {(() => {
                                   const recentLogs = [...patient.dailyLogs]
                                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                      .slice(0, 2)
                                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                                   
                                   if (recentLogs.length === 0) return <p className="text-[10px] text-gray-400 italic">Sem registros.</p>;
                                   const allLabNames = Array.from(new Set(recentLogs.flatMap(l => l.labs.map(lab => lab.testName)))).sort();

                                   return (
                                     <table className="w-full text-[9px] border-collapse border border-gray-200">
                                        <thead>
                                           <tr className="bg-gray-50">
                                              <th className="border p-0.5 text-left font-normal text-gray-600">Exame</th>
                                              {recentLogs.map(l => (
                                                 <th key={l.id} className="border p-0.5 text-center font-normal text-gray-600">{new Date(l.date).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}</th>
                                              ))}
                                           </tr>
                                        </thead>
                                        <tbody>
                                           {allLabNames.slice(0, 8).map(name => ( // Limit to top 8 labs to save space
                                              <tr key={name}>
                                                 <td className="border p-0.5 truncate max-w-[80px]">{name}</td>
                                                 {recentLogs.map(l => {
                                                    const res = l.labs.find(x => x.testName === name);
                                                    return <td key={l.id} className="border p-0.5 text-center">{res ? res.value : '-'}</td>
                                                 })}
                                              </tr>
                                           ))}
                                        </tbody>
                                     </table>
                                   );
                                })()}
                             </div>

                             {/* Prescription Compact */}
                             <div>
                                <strong className="text-[10px] text-gray-500 uppercase block">Prescrição:</strong>
                                <div className="text-[9px] bg-gray-50 p-1 rounded border border-gray-100 leading-tight max-h-[150px] overflow-hidden columns-2 gap-x-2">
                                   {patient.medicalPrescription ? (
                                      patient.medicalPrescription.split('\n').map((line, idx) => {
                                          if (!line.trim()) return null;
                                          const isStruck = line.startsWith('~~');
                                          const displayText = isStruck ? line.substring(2) : line;
                                          return (
                                            <div key={idx} className={`break-inside-avoid mb-0.5 ${isStruck ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                                {displayText}
                                            </div>
                                          );
                                      })
                                   ) : "Sem prescrição."}
                                </div>
                             </div>

                          </div>
                       ))}
                    </div>
                 </div>
             </div>
          </div>
        )}

      </main>
    </div>
  );
}