
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Beaker, Droplets } from 'lucide-react';
import { DailyLog, VitalSigns, LabResult, Conduct, FluidBalance } from '../types';

interface DailyLogFormProps {
  onSave: (log: Omit<DailyLog, 'id'>) => void;
  onCancel: () => void;
  initialPrescriptions?: string[];
  initialData?: DailyLog;
  patientUnit?: 'UTI' | 'Enfermaria' | 'Arquivo Morto';
}

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
  { name: 'Lactato', unit: 'mmol/L' },
  { name: 'aPTT', unit: 's' },
  { name: 'INR', unit: '' },
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
    capillaryBloodGlucose: '',
  });
  
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [fluidBalance, setFluidBalance] = useState<FluidBalance>(initialData?.fluidBalance || { intake: 0, output: 0, net: 0 });

  useEffect(() => {
    setFluidBalance(prev => ({ ...prev, net: (prev.intake || 0) - (prev.output || 0) }));
  }, [fluidBalance.intake, fluidBalance.output]);

  const [prescriptions, setPrescriptions] = useState<string[]>(
    initialData?.prescriptions || (initialPrescriptions && initialPrescriptions.length > 0 ? initialPrescriptions : [''])
  );
  
  const [conducts, setConducts] = useState<Conduct[]>(initialData?.conducts || [{ description: '', verified: false }]);

  const [labs, setLabs] = useState<LabResult[]>(() => {
    const baseList = STANDARD_LABS.map(std => ({ testName: std.name, value: '', unit: std.unit, referenceRange: '' }));
    if (initialData?.labs) {
      const existingMap = new Map(initialData.labs.map(l => [l.testName, l]));
      const mergedList = baseList.map(item => {
        const existing = existingMap.get(item.testName);
        if (existing) {
          existingMap.delete(item.testName);
          return existing;
        }
        return item;
      });
      return [...mergedList, ...Array.from(existingMap.values())];
    }
    return baseList;
  });

  const handlePrescriptionChange = (index: number, value: string) => {
    setPrescriptions(prev => { const copy = [...prev]; copy[index] = value; return copy; });
  };

  const addPrescription = () => setPrescriptions(prev => [...prev, '']);
  const removePrescription = (index: number) => setPrescriptions(prev => prev.filter((_, i) => i !== index));

  const handleConductChange = (index: number, field: keyof Conduct, value: any) => {
    setConducts(prev => { const copy = [...prev]; copy[index] = { ...copy[index], [field]: value }; return copy; });
  };

  const addConduct = () => setConducts(prev => [...prev, { description: '', verified: false }]);
  const removeConduct = (index: number) => setConducts(prev => prev.filter((_, i) => i !== index));

  const updateLab = (index: number, field: keyof LabResult, value: string) => {
    setLabs(prev => { const copy = [...prev]; copy[index] = { ...copy[index], [field]: value }; return copy; });
  };

  const addLab = () => setLabs(prev => [...prev, { testName: '', value: '', unit: '', referenceRange: '' }]);
  const removeLab = (index: number) => setLabs(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      date,
      vitalSigns: vitals,
      notes: notes,
      prescriptions: prescriptions.filter(p => p.trim() !== ''),
      conducts: conducts.filter(c => c.description.trim() !== ''),
      labs: labs.filter(l => l.value.toString().trim() !== ''),
      fluidBalance: patientUnit === 'UTI' ? fluidBalance : undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-[13px] lg:text-[15px] text-slate-900">
      <div className="flex items-center gap-4">
        <label className="font-bold text-slate-700 uppercase text-[11px] tracking-wider">Data:</label>
        <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 outline-none font-medium text-black" />
      </div>

      {patientUnit === 'UTI' && (
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
           <h3 className="text-[11px] font-bold text-blue-900 uppercase mb-3 flex items-center gap-2"><Droplets size={16} className="text-blue-500" /> Balanço Hídrico (ml)</h3>
           <div className="grid grid-cols-3 gap-3">
              <div><label className="text-[10px] text-blue-800 uppercase font-bold block mb-1">Entrada</label><input type="number" value={fluidBalance.intake || ''} onChange={e => setFluidBalance({...fluidBalance, intake: parseFloat(e.target.value) || 0})} className="w-full border border-blue-200 rounded-lg px-3 py-1.5 text-sm outline-none bg-white font-medium text-black" placeholder="0" /></div>
              <div><label className="text-[10px] text-blue-800 uppercase font-bold block mb-1">Saída</label><input type="number" value={fluidBalance.output || ''} onChange={e => setFluidBalance({...fluidBalance, output: parseFloat(e.target.value) || 0})} className="w-full border border-blue-200 rounded-lg px-3 py-1.5 text-sm outline-none bg-white font-medium text-black" placeholder="0" /></div>
              <div className="flex flex-col justify-end"><div className={`w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white font-bold text-center ${fluidBalance.net > 0 ? 'text-blue-600' : fluidBalance.net < 0 ? 'text-red-600' : 'text-slate-500'}`}>Net: {fluidBalance.net > 0 ? '+' : ''}{fluidBalance.net}</div></div>
           </div>
        </div>
      )}

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest mb-3">Sinais Vitais</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
           {['temperature', 'heartRate', 'bloodPressureSys', 'bloodPressureDia', 'oxygenSaturation', 'capillaryBloodGlucose'].map((f) => (
             <div key={f}><label className="text-[10px] text-slate-600 uppercase font-bold mb-1 block">{f === 'bloodPressureSys' ? 'PAS' : f === 'bloodPressureDia' ? 'PAD' : f.substring(0, 4)}</label><input type="text" value={(vitals as any)[f]} onChange={e => setVitals({...vitals, [f]: e.target.value})} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm outline-none font-medium text-black" /></div>
           ))}
        </div>
      </div>

      <div><label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest block mb-1.5">Evolução Clínica e Notas</label><textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)} className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none text-slate-900 font-medium leading-relaxed" placeholder="Descreva aqui o estado clínico..." /></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1"><h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Prescrição</h3><button type="button" onClick={addPrescription} className="text-[10px] text-medical-600 font-bold border border-medical-200 px-2 py-1 rounded bg-white shadow-sm">+ Adicionar</button></div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto border border-slate-200 p-2 rounded-xl bg-slate-50/50">
            {prescriptions.map((p, i) => (
              <div key={i} className="flex gap-2 items-center bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm">
                <input type="text" value={p} onChange={e => handlePrescriptionChange(i, e.target.value)} className="flex-1 border-none bg-transparent p-1 text-[13px] outline-none text-black font-medium" placeholder="Ex: Medicamento..." />
                <button type="button" onClick={() => removePrescription(i)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={16}/></button>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1"><h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Condutas</h3><button type="button" onClick={addConduct} className="text-[10px] text-medical-600 font-bold border border-medical-200 px-2 py-1 rounded bg-white shadow-sm">+ Adicionar</button></div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto border border-slate-200 p-2 rounded-xl bg-slate-50/50">
            {conducts.map((c, i) => (
              <div key={i} className="flex gap-2 items-center bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm">
                <input type="checkbox" checked={c.verified} onChange={e => handleConductChange(i, 'verified', e.target.checked)} className="w-4 h-4 rounded-md accent-medical-600" />
                <input type="text" value={c.description} onChange={e => handleConductChange(i, 'description', e.target.value)} className="flex-1 border-none bg-transparent p-1 text-[13px] outline-none text-black font-medium" placeholder="Ex: Solicitar..." />
                <button type="button" onClick={() => removeConduct(i)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={16}/></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2 px-1"><h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Exames Laboratoriais</h3><button type="button" onClick={addLab} className="text-[10px] text-medical-600 font-bold border border-medical-200 px-2 py-0.5 rounded bg-white shadow-sm">+ Outro</button></div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-inner">
          {labs.map((l, i) => (
            <div key={i} className="bg-white p-1.5 rounded-lg border border-slate-200 relative group shadow-sm">
              <label className="text-[9px] text-slate-400 font-bold block truncate mb-0.5 uppercase tracking-tight">{l.testName || 'EXAME'}</label>
              <input type="text" value={l.value} onChange={e => updateLab(i, 'value', e.target.value)} className="w-full outline-none text-sm font-bold text-center text-black" placeholder="-" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-4">
        <button type="button" onClick={onCancel} className="px-5 py-2 text-slate-500 hover:text-slate-800 font-bold uppercase">Cancelar</button>
        <button type="submit" className="px-8 py-2 bg-medical-600 text-white rounded-xl hover:bg-medical-700 font-bold uppercase shadow-lg flex items-center gap-2"><Save size={18} /> Salvar Registro</button>
      </div>
    </form>
  );
};

export default DailyLogForm;
