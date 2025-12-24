
import React, { useState } from 'react';
import { DailyLog } from '../types';
import { ArrowUp, ArrowDown, X, Plus } from 'lucide-react';

interface LabResultTableProps {
  logs: DailyLog[];
  onUpdateValue: (logId: string, testName: string, value: string, unit?: string) => void;
}

const REFERENCE_RANGES: Record<string, { min: number; max: number; onlyHighBad?: boolean; onlyLowBad?: boolean }> = {
  'Sódio': { min: 135, max: 145 },
  'Potássio': { min: 3.5, max: 5.0 },
  'Ureia': { min: 15, max: 45, onlyHighBad: true },
  'Creatinina': { min: 0.6, max: 1.2, onlyHighBad: true },
  'Hemoglobina': { min: 12, max: 16, onlyLowBad: true },
  'Hematócrito': { min: 36, max: 48, onlyLowBad: true },
  'Leucócitos': { min: 4000, max: 11000 },
  'Plaquetas': { min: 150000, max: 450000, onlyLowBad: true },
  'PCR': { min: 0, max: 5, onlyHighBad: true },
  'Lactato': { min: 0, max: 2.0, onlyHighBad: true },
  'pH': { min: 7.35, max: 7.45 },
  'pO2': { min: 80, max: 100, onlyLowBad: true },
  'pCO2': { min: 35, max: 45 },
  'Bicarbonato': { min: 22, max: 26 },
  'SatO2': { min: 95, max: 100, onlyLowBad: true }
};

const MANDATORY_TEST_ORDER = [
  'Sódio', 'Potássio', 'Ureia', 'Creatinina', 'Hemoglobina', 'Hematócrito',
  'Leucócitos', 'Plaquetas', 'PCR', 'Lactato', 'aPTT', 'INR', 'pH', 'pO2', 'pCO2', 'Bicarbonato', 'SatO2'
];

const QUICK_SUGGESTIONS = [
  'Magnésio', 'Cálcio', 'Fósforo', 'Troponina', 'Dímero-D', 'Procalcitonina', 'Glicemia', 'Cloro'
];

const TEST_ABBREVIATIONS: Record<string, string> = {
  'Sódio': 'Na+', 'Potássio': 'K+', 'Ureia': 'Ur', 'Creatinina': 'Cr',
  'Hemoglobina': 'Hb', 'Hematócrito': 'Ht', 'Leucócitos': 'Leuco', 'Plaquetas': 'Plq',
  'PCR': 'PCR', 'Lactato': 'Lac', 'aPTT': 'aPTT', 'INR': 'INR', 'pH': 'pH', 'pO2': 'pO2',
  'pCO2': 'pCO2', 'Bicarbonato': 'BIC', 'SatO2': 'Sat'
};

const LabResultTable: React.FC<LabResultTableProps> = ({ logs, onUpdateValue }) => {
  const [editingCell, setEditingCell] = useState<{ logId: string; testName: string } | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [newExamName, setNewExamName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Nomes de exames que já existem nos logs
  const existingExamNames = Array.from(new Set(logs.flatMap(l => l.labs.map(lab => lab.testName))));
  
  // Lista total de exames para exibir como linhas - Explicitly typed as string[] to avoid 'unknown' errors
  const allTestNames: string[] = Array.from(new Set<string>([...MANDATORY_TEST_ORDER, ...existingExamNames]))
    .sort((a: string, b: string) => {
      // Fix: Explicitly typed parameters a and b as string
      const idxA = MANDATORY_TEST_ORDER.indexOf(a);
      const idxB = MANDATORY_TEST_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      // Fix: Property 'localeCompare' now correctly resolved on string type
      return a.localeCompare(b);
    });

  const getTrendColor = (testName: string, current: string, previous: string | undefined) => {
    if (!previous || !current) return 'text-slate-400';
    const curr = parseFloat(current.replace(',', '.'));
    const prev = parseFloat(previous.replace(',', '.'));
    const range = REFERENCE_RANGES[testName];
    if (isNaN(curr) || isNaN(prev) || !range) return 'text-slate-400';

    const isReturningToNormal = 
      (curr >= range.min && curr <= range.max) || 
      (curr > prev && curr <= range.max && prev < range.min) || 
      (curr < prev && curr >= range.min && prev > range.max);

    return isReturningToNormal ? 'text-green-600' : 'text-red-600';
  };

  const handleSave = () => {
    if (editingCell) {
      onUpdateValue(editingCell.logId, editingCell.testName, tempValue);
      setEditingCell(null);
    }
  };

  const handleAddNewExamRow = (name: string) => {
    const finalName = name.trim();
    if (!finalName) return;
    
    // Pegamos o último log para associar o novo exame
    if (sortedLogs.length > 0) {
      const lastLog = sortedLogs[sortedLogs.length - 1];
      onUpdateValue(lastLog.id, finalName, ''); // Cria o exame com valor vazio para ele aparecer na lista
      setNewExamName('');
      setShowSuggestions(false);
    } else {
      alert("Adicione primeiro uma evolução diária para poder inserir exames.");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto border border-slate-300 rounded-xl bg-white shadow-md">
        <table className="min-w-full divide-y divide-slate-300 text-[11px] lg:text-[13px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="sticky left-0 z-20 bg-slate-50 px-3 py-2 text-left font-bold text-slate-900 uppercase border-r border-slate-300 w-24 lg:w-32">Exame</th>
              {sortedLogs.map(log => (
                <th key={log.id} className="px-2 py-2 text-center font-bold text-slate-900 border-r border-slate-300 min-w-[60px] lg:min-w-[80px]">
                  {new Date(log.date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {allTestNames.map(testName => (
              <tr key={testName} className="hover:bg-slate-50 transition-colors">
                <td className="sticky left-0 z-10 bg-white px-3 py-2 font-bold text-slate-700 border-r border-slate-200 shadow-sm uppercase truncate">
                  {/* Fix: testName is correctly typed as string, so index access and display are valid */}
                  {TEST_ABBREVIATIONS[testName] || testName}
                </td>
                {sortedLogs.map((log, idx) => {
                  const res = log.labs.find(l => l.testName === testName);
                  const val = res ? res.value.toString() : '';
                  const prevRes = idx > 0 ? sortedLogs[idx-1].labs.find(l => l.testName === testName) : null;
                  const prevVal = prevRes ? prevRes.value.toString() : undefined;
                  
                  const isEditing = editingCell?.logId === log.id && editingCell?.testName === testName;
                  // Fix: testName is string, ensuring getTrendColor call is valid
                  const trendColor = getTrendColor(testName, val, prevVal);
                  const diff = (parseFloat(val.replace(',','.')) || 0) - (parseFloat(prevVal?.replace(',','.') || '0') || 0);

                  return (
                    <td 
                      key={log.id} 
                      className="px-2 py-2 text-center border-r border-slate-100 relative cursor-pointer group"
                      onClick={() => { setEditingCell({logId: log.id, testName}); setTempValue(val); }}
                    >
                      {isEditing ? (
                        <input 
                          autoFocus className="absolute inset-0 w-full h-full text-center font-bold outline-none bg-blue-50 text-black border-2 border-medical-500 z-10"
                          value={tempValue} onChange={e => setTempValue(e.target.value)}
                          onBlur={handleSave} onKeyDown={e => e.key === 'Enter' && handleSave()}
                        />
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <span className={`font-medium ${val ? 'text-black' : 'text-slate-300'}`}>{val || '-'}</span>
                          {val && prevVal && diff !== 0 && (
                            diff > 0 ? <ArrowUp size={12} className={trendColor}/> : <ArrowDown size={12} className={trendColor}/>
                          )}
                        </div>
                      )}
                      {!val && !isEditing && <Plus size={10} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-slate-300" />}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="bg-slate-50/50">
              <td className="sticky left-0 z-10 bg-slate-50 px-3 py-3 border-r border-slate-200">
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="+ Adicionar exame..."
                    className="w-full bg-transparent border-b border-dashed border-slate-400 outline-none text-[11px] font-bold uppercase text-medical-700 placeholder:text-slate-400 focus:border-medical-600"
                    value={newExamName}
                    onChange={e => setNewExamName(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={e => e.key === 'Enter' && handleAddNewExamRow(newExamName)}
                  />
                  {showSuggestions && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-30 p-2">
                      <div className="flex justify-between items-center mb-1 pb-1 border-b border-slate-100">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Sugestões</span>
                        <button onClick={() => setShowSuggestions(false)} className="text-slate-300 hover:text-slate-600"><X size={12}/></button>
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        {QUICK_SUGGESTIONS.filter(s => !allTestNames.includes(s)).map(s => (
                          <button 
                            key={s} 
                            onClick={() => handleAddNewExamRow(s)}
                            className="text-left px-2 py-1 text-[10px] hover:bg-slate-100 rounded text-slate-700 font-medium uppercase"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </td>
              <td colSpan={sortedLogs.length} className="px-3 py-2 italic text-slate-400 text-[10px] uppercase">
                {newExamName ? `Enter p/ criar "${newExamName.toUpperCase()}"` : 'Digite o nome do exame à esquerda'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LabResultTable;
