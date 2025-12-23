
import React, { useState } from 'react';
import { DailyLog } from '../types';
import { ArrowUp, ArrowDown, Minus, X, Save, Plus } from 'lucide-react';

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
  'aPTT': { min: 25, max: 35 },
  'INR': { min: 0.8, max: 1.2, onlyHighBad: true },
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

const TEST_ABBREVIATIONS: Record<string, string> = {
  'Sódio': 'Na+', 'Potássio': 'K+', 'Ureia': 'Ur', 'Creatinina': 'Cr',
  'Hemoglobina': 'Hb', 'Hematócrito': 'Ht', 'Leucócitos': 'Leuco', 'Plaquetas': 'Plq',
  'PCR': 'PCR', 'Lactato': 'Lac', 'aPTT': 'aPTT', 'INR': 'INR', 'pH': 'pH', 'pO2': 'pO2',
  'pCO2': 'pCO2', 'Bicarbonato': 'BIC', 'SatO2': 'Sat'
};

const LabResultTable: React.FC<LabResultTableProps> = ({ logs, onUpdateValue }) => {
  const [editingCell, setEditingCell] = useState<{ logId: string; testName: string } | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [showAddExamRow, setShowAddExamRow] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  
  const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const uniqueLabNames: string[] = Array.from(new Set(logs.flatMap(l => l.labs.map(lab => lab.testName))));
  
  const allTestNames: string[] = Array.from(new Set([...MANDATORY_TEST_ORDER, ...uniqueLabNames]))
    .sort((a, b) => {
      const idxA = MANDATORY_TEST_ORDER.indexOf(a);
      const idxB = MANDATORY_TEST_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return idxA !== -1 ? -1 : idxB !== -1 ? 1 : a.localeCompare(b);
    });

  const getTrendColor = (testName: string, current: string, previous: string | undefined) => {
    if (!previous) return 'text-slate-400';
    const curr = parseFloat(current.replace(',', '.'));
    const prev = parseFloat(previous.replace(',', '.'));
    const range = REFERENCE_RANGES[testName];
    if (isNaN(curr) || isNaN(prev) || !range) return 'text-slate-400';

    const diff = curr - prev;
    if (Math.abs(diff) < 0.01) return 'text-slate-400';

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

  const handleAddNewExamRow = () => {
    if (newExamName.trim() && sortedLogs.length > 0) {
      onUpdateValue(sortedLogs[sortedLogs.length - 1].id, newExamName.trim(), '');
      setNewExamName('');
      setShowAddExamRow(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end">
        <button 
          onClick={() => setShowAddExamRow(!showAddExamRow)}
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-lg text-slate-700 transition-colors border border-slate-300 shadow-sm"
        >
          <Plus size={14} /> Novo Tipo de Exame
        </button>
      </div>
      
      {showAddExamRow && (
        <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg flex gap-2 animate-in fade-in slide-in-from-top-1">
          <input 
            autoFocus
            className="flex-1 px-3 py-1 text-sm border border-slate-300 rounded outline-none focus:border-medical-500" 
            placeholder="Nome do exame (ex: Magnésio)"
            value={newExamName}
            onChange={e => setNewExamName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddNewExamRow()}
          />
          <button onClick={handleAddNewExamRow} className="bg-medical-600 text-white px-3 py-1 rounded font-bold text-xs uppercase shadow-sm">Adicionar</button>
          <button onClick={() => setShowAddExamRow(false)} className="text-slate-400 p-1 hover:bg-slate-200 rounded"><X size={18}/></button>
        </div>
      )}

      <div className="overflow-x-auto border border-slate-300 rounded-xl bg-white shadow-md">
        <table className="min-w-full divide-y divide-slate-300 text-[11px] lg:text-[13px]">
          <thead className="bg-slate-100">
            <tr>
              <th className="sticky left-0 z-20 bg-slate-100 px-3 py-2 text-left font-bold text-slate-900 uppercase border-r border-slate-300 w-24 lg:w-32 tracking-tight">Exame</th>
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
                <td className="sticky left-0 z-10 bg-white px-3 py-2 font-bold text-slate-700 border-r border-slate-200 shadow-sm">
                  {TEST_ABBREVIATIONS[testName] || testName}
                </td>
                {sortedLogs.map((log, idx) => {
                  const res = log.labs.find(l => l.testName === testName);
                  const val = res ? res.value.toString() : '';
                  const prevRes = idx > 0 ? sortedLogs[idx-1].labs.find(l => l.testName === testName) : null;
                  const prevVal = prevRes ? prevRes.value.toString() : undefined;
                  
                  const isEditing = editingCell?.logId === log.id && editingCell?.testName === testName;
                  const trendColor = getTrendColor(testName, val, prevVal);
                  const diff = (parseFloat(val.replace(',','.')) || 0) - (parseFloat(prevVal?.replace(',','.') || '0') || 0);

                  return (
                    <td 
                      key={log.id} 
                      className="px-2 py-2 text-center border-r border-slate-100 relative cursor-pointer"
                      onClick={() => { setEditingCell({logId: log.id, testName}); setTempValue(val); }}
                    >
                      {isEditing ? (
                        <input 
                          autoFocus className="absolute inset-0 w-full h-full text-center font-bold outline-none bg-blue-100 text-black border-2 border-medical-500 z-10"
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
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LabResultTable;
