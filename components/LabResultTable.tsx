import React, { useState } from 'react';
import { DailyLog } from '../types';
import { ArrowUp, ArrowDown, Minus, Plus, X, Save, AlertCircle } from 'lucide-react';

interface LabResultTableProps {
  logs: DailyLog[];
  onUpdateValue: (logId: string, testName: string, value: string, unit?: string) => void;
}

// Order specified by clinical requirement. These will ALWAYS appear in the table.
const MANDATORY_TEST_ORDER = [
  'Sódio',
  'Potássio',
  'Ureia',
  'Creatinina',
  'Hemoglobina',
  'Hematócrito',
  'Leucócitos', 
  'Plaquetas',
  'PCR',
  'aPTT',
  'INR',
  // Gasometry
  'pH',
  'pO2',
  'pCO2',
  'Bicarbonato',
  'SatO2'
];

// Clinical Logic: Define if "High is Bad" or "Low is Bad" to color arrows correctly
const CLINICAL_DIRECTION: Record<string, 'high_bad' | 'low_bad'> = {
  'Ureia': 'high_bad',
  'Creatinina': 'high_bad',
  'Leucócitos': 'high_bad', 
  'PCR': 'high_bad',
  'INR': 'high_bad', 
  'Lactato': 'high_bad',
  'Troponina': 'high_bad',
  'Dímero-D': 'high_bad',
  'Hemoglobina': 'low_bad',
  'Hematócrito': 'low_bad',
  'Plaquetas': 'low_bad',
  'pO2': 'low_bad',
  'SatO2': 'low_bad'
};

const LabResultTable: React.FC<LabResultTableProps> = ({ logs, onUpdateValue }) => {
  const [editingCell, setEditingCell] = useState<{ logId: string; testName: string } | null>(null);
  const [tempValue, setTempValue] = useState('');
  
  // State for adding new tests
  const [manuallyAddedTests, setManuallyAddedTests] = useState<string[]>([]);
  const [isAddingTest, setIsAddingTest] = useState(false);
  const [newTestNameInput, setNewTestNameInput] = useState('');

  // 1. Collect all unique test names across all logs + manually added ones + MANDATORY ones
  const derivedTestNames = logs.flatMap(log => log.labs.map(lab => lab.testName));
  const uniqueNames = Array.from(
    new Set([...MANDATORY_TEST_ORDER, ...derivedTestNames, ...manuallyAddedTests])
  );

  // 2. Sort test names based on mandatory order, then alphabetical
  const allTestNames: string[] = uniqueNames.sort((a, b) => {
    const indexA = MANDATORY_TEST_ORDER.indexOf(a);
    const indexB = MANDATORY_TEST_ORDER.indexOf(b);

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  // 3. Sort logs by date (ascending for table left-to-right progression)
  const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Helper to determine change direction with clinical context
  const getChangeIndicator = (testName: string, currentVal: string, prevVal: string | undefined) => {
    if (!prevVal) return null;
    
    // Attempt to parse numbers
    const currNum = parseFloat(currentVal.replace(',', '.'));
    const prevNum = parseFloat(prevVal.replace(',', '.'));

    if (isNaN(currNum) || isNaN(prevNum)) return null;

    const diff = currNum - prevNum;
    if (Math.abs(diff) < 0.01) return <Minus size={10} className="text-gray-300 inline ml-0.5" />;

    const direction = CLINICAL_DIRECTION[testName];
    
    let upColor = "text-gray-500";
    let downColor = "text-gray-500";

    if (direction === 'high_bad') {
       upColor = "text-red-500"; 
       downColor = "text-green-600"; 
    } else if (direction === 'low_bad') {
       upColor = "text-green-600"; 
       downColor = "text-red-500"; 
    }

    if (diff > 0) {
      return <ArrowUp size={12} className={`${upColor} inline ml-0.5`} />;
    } else {
      return <ArrowDown size={12} className={`${downColor} inline ml-0.5`} />;
    }
  };

  const handleStartEdit = (logId: string, testName: string, currentValue: string) => {
    setEditingCell({ logId, testName });
    setTempValue(currentValue);
  };

  const handleSave = () => {
    if (editingCell) {
      onUpdateValue(editingCell.logId, editingCell.testName, tempValue);
      setEditingCell(null);
      setTempValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setEditingCell(null);
  };

  const handleAddNewTest = () => {
      if (newTestNameInput.trim()) {
          setManuallyAddedTests(prev => [...prev, newTestNameInput.trim()]);
          setNewTestNameInput('');
          setIsAddingTest(false);
      }
  };

  if (logs.length === 0) {
      return <div className="text-center p-6 text-gray-500 italic">Nenhum registro disponível para comparação.</div>;
  }

  return (
    <div className="flex flex-col space-y-4">
        {/* Table Container with Horizontal Scroll */}
        <div className="overflow-x-auto pb-2 border rounded-lg border-gray-200 shadow-sm bg-white relative">
            <table className="min-w-full divide-y divide-gray-200 border-collapse table-fixed w-full">
                <thead className="bg-gray-50">
                    <tr>
                        {/* Sticky Header Column */}
                        <th 
                            scope="col" 
                            className="sticky left-0 z-20 bg-gray-50 px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-[140px] min-w-[140px]"
                        >
                            Exame
                        </th>
                        {sortedLogs.map(log => (
                            <th key={log.id} scope="col" className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[100px]">
                                <div className="flex flex-col">
                                    <span>{new Date(log.date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}</span>
                                    <span className="text-[10px] font-normal text-gray-400">{new Date(log.date).toLocaleDateString('pt-BR', {weekday: 'short'})}</span>
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {allTestNames.map((testName, rowIdx) => (
                        <tr key={testName} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                            {/* Sticky Test Name Column */}
                            <td className="sticky left-0 z-10 bg-inherit px-3 py-3 text-sm font-medium text-gray-900 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] truncate" title={testName}>
                                {testName}
                            </td>
                            
                            {/* Data Columns */}
                            {sortedLogs.map((log, colIdx) => {
                                const result = log.labs.find(l => l.testName === testName);
                                const val = result ? result.value : '';
                                const unit = result ? result.unit : '';
                                
                                // Get previous value for trend arrow
                                const prevLog = colIdx > 0 ? sortedLogs[colIdx - 1] : undefined;
                                const prevResult = prevLog ? prevLog.labs.find(l => l.testName === testName) : undefined;
                                const prevVal = prevResult ? prevResult.value?.toString() : undefined;

                                const isEditing = editingCell?.logId === log.id && editingCell?.testName === testName;

                                return (
                                    <td 
                                        key={`${log.id}-${testName}`} 
                                        className="px-2 py-2 text-sm text-gray-500 text-center relative group touch-manipulation"
                                        onClick={() => !isEditing && handleStartEdit(log.id, testName, val.toString())}
                                    >
                                        {isEditing ? (
                                            <div className="absolute inset-0 z-30 p-1 flex items-center justify-center bg-white shadow-lg ring-2 ring-medical-500">
                                                <input 
                                                    autoFocus
                                                    type="text" 
                                                    inputMode="decimal"
                                                    className="w-full h-full text-center outline-none bg-gray-50 rounded text-gray-900 font-bold"
                                                    value={tempValue}
                                                    onChange={(e) => setTempValue(e.target.value)}
                                                    onKeyDown={handleKeyDown}
                                                    onBlur={handleSave}
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center h-full min-h-[2rem] w-full cursor-pointer hover:bg-gray-100 rounded transition-colors">
                                                <span className={`${!val ? 'text-gray-300' : 'font-medium text-gray-800'}`}>
                                                    {val || '-'}
                                                </span>
                                                {val && unit && <span className="text-[10px] text-gray-400 ml-0.5 hidden sm:inline">{unit}</span>}
                                                {val && prevVal && getChangeIndicator(testName, val.toString(), prevVal)}
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

        {/* Add New Test Button Row */}
        <div className="flex items-center gap-2 mt-2">
            {isAddingTest ? (
                <div className="flex items-center gap-2 flex-1 animate-in fade-in slide-in-from-left-2">
                    <input 
                        autoFocus
                        type="text" 
                        placeholder="Nome do exame..." 
                        className="flex-1 border rounded-md px-3 py-2 text-sm focus:border-medical-500 outline-none"
                        value={newTestNameInput}
                        onChange={(e) => setNewTestNameInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNewTest()}
                    />
                    <button 
                        onClick={handleAddNewTest}
                        className="bg-medical-600 text-white px-3 py-2 rounded-md hover:bg-medical-700"
                    >
                        <Save size={18} />
                    </button>
                    <button 
                        onClick={() => setIsAddingTest(false)}
                        className="bg-gray-200 text-gray-600 px-3 py-2 rounded-md hover:bg-gray-300"
                    >
                        <X size={18} />
                    </button>
                </div>
            ) : (
                <button 
                    onClick={() => setIsAddingTest(true)}
                    className="flex items-center gap-2 text-sm font-medium text-medical-600 hover:text-medical-800 hover:bg-medical-50 px-3 py-2 rounded-md transition-colors"
                >
                    <Plus size={16} /> Adicionar Linha de Exame
                </button>
            )}
        </div>
        <div className="text-[10px] text-gray-400 italic">
            * Clique em qualquer célula para editar o valor. As setas indicam tendência em relação ao dia anterior.
        </div>
    </div>
  );
};

export default LabResultTable;
