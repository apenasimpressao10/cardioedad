import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Beaker, Droplets } from 'lucide-react';
import { DailyLog, VitalSigns, LabResult, Conduct, FluidBalance } from '../types';

interface DailyLogFormProps {
  onSave: (log: Omit<DailyLog, 'id'>) => void;
  onCancel: () => void;
  initialPrescriptions?: string[];
  initialData?: DailyLog;
  patientUnit?: 'UTI' | 'Enfermaria'; // New prop to control visibility
}

// Standard labs list matching the comparative table order
const STANDARD_LABS = [
  { name: 'Sódio', unit: 'mEq/L' },
  { name: 'Potássio', unit: 'mEq/L' },
  { name: 'Ureia', unit: 'mg/dL' },
  { name: 'Creatinina', unit: 'mg/dL' },
  { name: 'Hemoglobina', unit: 'g/dL' },
  { name: 'Hematócrito', unit: '%' },
  { name: 'Leucócitos', unit: '/mm³' },
  { name: 'Plaquetas', unit: '/mm³' },
  { name: 'PCR', unit: 'mg/L' },
  { name: 'aPTT', unit: 's' },
  { name: 'INR', unit: '' },
  // Gasometry
  { name: 'pH', unit: '' },
  { name: 'pO2', unit: 'mmHg' },
  { name: 'pCO2', unit: 'mmHg' },
  { name: 'Bicarbonato', unit: 'mEq/L' },
  { name: 'SatO2', unit: '%' },
];

const DailyLogForm: React.FC<DailyLogFormProps> = ({ onSave, onCancel, initialPrescriptions, initialData, patientUnit }) => {
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [vitals, setVitals] = useState<VitalSigns>(initialData?.vitalSigns || {
    temperature: '36.5',
    heartRate: '72',
    respiratoryRate: '16',
    bloodPressureSys: '120',
    bloodPressureDia: '80',
    oxygenSaturation: '98',
    capillaryBloodGlucose: '98',
  });
  const [notes, setNotes] = useState(initialData?.notes || '');
  
  // Fluid Balance State
  const [fluidBalance, setFluidBalance] = useState<FluidBalance>(initialData?.fluidBalance || {
    intake: 0,
    output: 0,
    net: 0
  });

  // Automatically calculate net balance
  useEffect(() => {
    setFluidBalance(prev => ({
        ...prev,
        net: (prev.intake || 0) - (prev.output || 0)
    }));
  }, [fluidBalance.intake, fluidBalance.output]);

  // Lists
  const [prescriptions, setPrescriptions] = useState<string[]>(
    initialData?.prescriptions || (initialPrescriptions && initialPrescriptions.length > 0 ? initialPrescriptions : [''])
  );
  
  // Conducts (formerly Procedures)
  const [conducts, setConducts] = useState<Conduct[]>(
    initialData?.conducts || [{ description: '', verified: false }]
  );

  // Initialize Labs with Standard List merged with existing data
  const [labs, setLabs] = useState<LabResult[]>(() => {
    // Create base list from standard exams
    const baseList = STANDARD_LABS.map(std => ({
      testName: std.name,
      value: '', // Empty by default
      unit: std.unit,
      referenceRange: ''
    }));

    if (initialData?.labs) {
      // Create a map of existing values for quick lookup
      const existingMap = new Map(initialData.labs.map(l => [l.testName, l]));
      
      // Update base list with existing values
      const mergedList = baseList.map(item => {
        const existing = existingMap.get(item.testName);
        if (existing) {
          existingMap.delete(item.testName); // Remove from map to track what's left
          return existing;
        }
        return item;
      });

      // Append any custom exams that were in the initial data but not in standard list
      return [...mergedList, ...Array.from(existingMap.values())];
    }

    return baseList;
  });

  // Helpers for dynamic inputs
  const handlePrescriptionChange = (index: number, value: string) => {
    setPrescriptions(prev => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const addPrescription = () => {
    setPrescriptions(prev => [...prev, '']);
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prev => prev.filter((_, i) => i !== index));
  };

  // Conducts Helpers
  const handleConductChange = (index: number, field: keyof Conduct, value: any) => {
    setConducts(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addConduct = () => {
    setConducts(prev => [...prev, { description: '', verified: false }]);
  };

  const removeConduct = (index: number) => {
    setConducts(prev => prev.filter((_, i) => i !== index));
  };

  // Lab Helpers
  const addLab = () => {
    setLabs(prev => [...prev, { testName: '', value: '', unit: '', referenceRange: '' }]);
  };
  
  const updateLab = (index: number, field: keyof LabResult, value: string) => {
    setLabs(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeLab = (index: number) => {
    setLabs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      date,
      vitalSigns: vitals,
      notes: notes,
      prescriptions: prescriptions.filter(p => p.trim() !== ''),
      conducts: conducts.filter(c => c.description.trim() !== ''),
      labs: labs.filter(l => l.value.toString().trim() !== ''), // Only save labs that have values
      fluidBalance: patientUnit === 'UTI' ? fluidBalance : undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Data do Registro</label>
        <input 
          type="date" 
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-medical-500 focus:ring-medical-500 sm:text-sm border p-2"
        />
      </div>

      {/* Fluid Balance - ONLY FOR UTI */}
      {patientUnit === 'UTI' && (
        <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
           <h3 className="text-md font-medium text-gray-900 border-b border-blue-200 pb-1 mb-3 flex items-center gap-2">
             <Droplets size={18} className="text-blue-500" /> Balanço Hídrico (24h)
           </h3>
           <div className="flex gap-4 items-end">
              <div className="flex-1">
                 <label className="text-xs text-gray-500 uppercase font-bold">Entrada (ml)</label>
                 <input 
                    type="number" 
                    value={fluidBalance.intake || ''} 
                    onChange={e => setFluidBalance({...fluidBalance, intake: parseFloat(e.target.value) || 0})}
                    className="w-full border rounded p-2 focus:border-blue-500 outline-none" 
                    placeholder="0"
                 />
              </div>
              <div className="flex-1">
                 <label className="text-xs text-gray-500 uppercase font-bold">Saída (ml)</label>
                 <input 
                    type="number" 
                    value={fluidBalance.output || ''} 
                    onChange={e => setFluidBalance({...fluidBalance, output: parseFloat(e.target.value) || 0})}
                    className="w-full border rounded p-2 focus:border-blue-500 outline-none" 
                    placeholder="0"
                 />
              </div>
              <div className="flex-1">
                 <label className="text-xs text-gray-500 uppercase font-bold">Balanço (ml)</label>
                 <div className={`w-full border rounded p-2 bg-gray-100 font-bold text-center ${fluidBalance.net > 0 ? 'text-blue-600' : fluidBalance.net < 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                    {fluidBalance.net > 0 ? '+' : ''}{fluidBalance.net}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Vital Signs */}
      <div>
        <h3 className="text-md font-medium text-gray-900 border-b pb-1 mb-3">Sinais Vitais</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
           <div>
             <label className="text-xs text-gray-500 uppercase">Temp (°C)</label>
             <input type="text" value={vitals.temperature} onChange={e => setVitals({...vitals, temperature: e.target.value})} className="w-full border rounded p-1" placeholder="36.5" />
           </div>
           <div>
             <label className="text-xs text-gray-500 uppercase">FC (bpm)</label>
             <input type="text" value={vitals.heartRate} onChange={e => setVitals({...vitals, heartRate: e.target.value})} className="w-full border rounded p-1" placeholder="72" />
           </div>
           <div>
             <label className="text-xs text-gray-500 uppercase">FR (irpm)</label>
             <input type="text" value={vitals.respiratoryRate} onChange={e => setVitals({...vitals, respiratoryRate: e.target.value})} className="w-full border rounded p-1" placeholder="16" />
           </div>
           <div>
             <label className="text-xs text-gray-500 uppercase">PA Sistólica</label>
             <input type="text" value={vitals.bloodPressureSys} onChange={e => setVitals({...vitals, bloodPressureSys: e.target.value})} className="w-full border rounded p-1" placeholder="120" />
           </div>
           <div>
             <label className="text-xs text-gray-500 uppercase">PA Diastólica</label>
             <input type="text" value={vitals.bloodPressureDia} onChange={e => setVitals({...vitals, bloodPressureDia: e.target.value})} className="w-full border rounded p-1" placeholder="80" />
           </div>
           <div>
             <label className="text-xs text-gray-500 uppercase">Sat O2 (%)</label>
             <input type="text" value={vitals.oxygenSaturation} onChange={e => setVitals({...vitals, oxygenSaturation: e.target.value})} className="w-full border rounded p-1" placeholder="98" />
           </div>
           <div>
             <label className="text-xs text-gray-500 uppercase">Glicemia (mg/dL)</label>
             <input type="text" value={vitals.capillaryBloodGlucose} onChange={e => setVitals({...vitals, capillaryBloodGlucose: e.target.value})} className="w-full border rounded p-1" placeholder="98" />
           </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Anotações</label>
        <textarea 
          rows={4}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-medical-500 focus:ring-medical-500 sm:text-sm border p-2"
          placeholder="Insira observações detalhadas..."
        />
      </div>

      {/* Prescriptions */}
      <div>
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-medium text-gray-900">Prescrições</h3>
            <button type="button" onClick={addPrescription} className="text-sm text-medical-600 flex items-center hover:text-medical-800"><Plus size={16} className="mr-1"/> Adicionar</button>
        </div>
        <ul className="space-y-2">
            {prescriptions.map((item, idx) => (
                <li key={idx} className="flex gap-2">
                    <span className="text-gray-400 self-center">•</span>
                    <input type="text" value={item} onChange={e => handlePrescriptionChange(idx, e.target.value)} className="flex-1 border-b border-gray-200 focus:border-medical-500 outline-none py-1 bg-transparent" placeholder="Medicamento, dosagem, frequência" />
                    <button type="button" onClick={() => removePrescription(idx)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                </li>
            ))}
        </ul>
      </div>

      {/* Conducts (formerly Procedures) */}
      <div>
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-medium text-gray-900">Condutas Diárias</h3>
            <button type="button" onClick={addConduct} className="text-sm text-medical-600 flex items-center hover:text-medical-800"><Plus size={16} className="mr-1"/> Adicionar</button>
        </div>
        <ul className="space-y-2">
            {conducts.map((item, idx) => (
                <li key={idx} className="flex gap-2 items-center">
                    <div className="flex items-center h-full pt-1">
                       <input 
                          type="checkbox" 
                          checked={item.verified} 
                          onChange={e => handleConductChange(idx, 'verified', e.target.checked)}
                          className="w-4 h-4 text-medical-600 border-gray-300 rounded focus:ring-medical-500 cursor-pointer"
                          title="Verificado/Concluído"
                       />
                    </div>
                    <input 
                      type="text" 
                      value={item.description} 
                      onChange={e => handleConductChange(idx, 'description', e.target.value)} 
                      className="flex-1 border-b border-gray-200 focus:border-medical-500 outline-none py-1 bg-transparent" 
                      placeholder="Descrição da conduta" 
                    />
                    <button type="button" onClick={() => removeConduct(idx)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                </li>
            ))}
        </ul>
      </div>

      {/* Lab Results - Grid Layout */}
      <div>
        <div className="flex justify-between items-center mb-3">
            <h3 className="text-md font-medium text-gray-900 flex items-center gap-2">
                <Beaker size={18} /> Resultados de Exames
            </h3>
            <button type="button" onClick={addLab} className="text-sm text-medical-600 flex items-center hover:text-medical-800">
                <Plus size={16} className="mr-1"/> Outro Exame
            </button>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {labs.map((lab, idx) => {
                    // Check if this lab is in the standard list
                    const isStandard = STANDARD_LABS.some(std => std.name === lab.testName);

                    if (isStandard) {
                        return (
                            <div key={idx} className="bg-white p-2 rounded border border-gray-200 shadow-sm flex flex-col">
                                <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 truncate" title={lab.testName}>
                                    {lab.testName}
                                </label>
                                <div className="flex items-baseline gap-1">
                                    <input 
                                        type="text" 
                                        value={lab.value} 
                                        onChange={e => updateLab(idx, 'value', e.target.value)} 
                                        className="flex-1 min-w-0 border-b border-gray-300 focus:border-medical-500 outline-none text-sm font-medium py-0.5 text-center" 
                                        placeholder="-" 
                                    />
                                    <span className="text-[10px] text-gray-400 select-none w-8 text-right">{lab.unit}</span>
                                </div>
                            </div>
                        );
                    } else {
                        // Custom/Manual Lab Entry
                        return (
                            <div key={idx} className="bg-white p-2 rounded border border-blue-100 shadow-sm flex flex-col relative group">
                                <button 
                                    type="button" 
                                    onClick={() => removeLab(idx)} 
                                    className="absolute top-1 right-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    tabIndex={-1}
                                >
                                    <Trash2 size={12} />
                                </button>
                                <input 
                                    type="text" 
                                    value={lab.testName} 
                                    onChange={e => updateLab(idx, 'testName', e.target.value)} 
                                    className="text-[10px] text-medical-700 font-bold uppercase mb-1 w-full border-none p-0 focus:ring-0 placeholder-gray-300" 
                                    placeholder="NOME DO EXAME"
                                />
                                <div className="flex items-baseline gap-1">
                                    <input 
                                        type="text" 
                                        value={lab.value} 
                                        onChange={e => updateLab(idx, 'value', e.target.value)} 
                                        className="flex-1 min-w-0 border-b border-gray-300 focus:border-medical-500 outline-none text-sm font-medium py-0.5 text-center" 
                                        placeholder="Valor" 
                                    />
                                    <input
                                        type="text"
                                        value={lab.unit}
                                        onChange={e => updateLab(idx, 'unit', e.target.value)}
                                        className="w-10 text-[10px] text-gray-500 text-right border-none p-0 focus:ring-0 placeholder-gray-300"
                                        placeholder="Unid"
                                    />
                                </div>
                            </div>
                        );
                    }
                })}
            </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">Cancelar</button>
        <button type="submit" className="px-4 py-2 bg-medical-600 text-white rounded-md hover:bg-medical-700 flex items-center gap-2"><Save size={18} /> {initialData ? 'Atualizar Registro' : 'Salvar Registro'}</button>
      </div>

    </form>
  );
};

export default DailyLogForm;