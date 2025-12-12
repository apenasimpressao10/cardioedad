import React, { useState } from 'react';
import { DailyLog } from '../types';
import { ArrowUp, ArrowDown, Minus, Plus, X, Save } from 'lucide-react';

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
  'Leucócitos', // Represents Total Leukocytes (deviation) as requested, matched to data key
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

// Abbreviation Dictionary
const TEST_ABBREVIATIONS: Record<string, string> = {
  'Sódio': 'Na+',
  'Potássio': 'K+',
  'Ureia': 'Ur',
  'Creatinina': 'Cr',
  'Hemoglobina': 'Hb',
  'Hematócrito': 'Ht',
  'Leucócitos': 'Leuco',
  'Plaquetas': 'Plaq',
  'PCR': 'PCR',
  'aPTT': 'aPTT',
  'INR': 'INR',
  'Magnésio': 'Mg',
  'Cálcio': 'Ca',
  'Glicemia': 'Glic',
  'Lactato': 'Lac',
  'Gasometria pH': 'pH',
  'Bicarbonato': 'Bic',
  'Troponina': 'Trop',
  'Dímero-D': 'Dim-D',
  'pO2': 'pO2',
  'pCO2': 'pCO2',
  'SatO2': 'SatO2'
};

// Clinical Logic: Define if "High is Bad" or "Low is Bad" to color arrows correctly
// 'high_bad': Increase = Red, Decrease = Green
// 'low_bad': Decrease = Red, Increase = Green
// undefined: Neutral (Gray)
const CLINICAL_DIRECTION: Record<string, 'high_bad' | 'low_bad'> = {
  'Ureia': 'high_bad',
  'Creatinina': 'high_bad',
  'Leucócitos': 'high_bad', // Generalizing for infection
  'PCR': 'high_bad',
  'INR': 'high_bad', // Generalizing for bleeding risk
  'Lactato': 'high_bad',
  'Troponina': 'high_bad',
  'Dímero-D': 'high_bad',
  'Hemoglobina': 'low_bad',
  'Hematócrito': 'low_bad',
  'Plaquetas': 'low_bad',
  'pO2': 'low_bad',
  'SatO2': 'low_bad'
};

// Helper to pivot data: Rows = Test Names, Columns = Dates
const LabResultTable: React.FC<LabResultTableProps> = ({ logs, onUpdateValue }) => {
  const [editingCell, setEditingCell] = useState<{ logId: string; testName: string } | null>(null);
  const [tempValue, setTempValue] = useState('');
  
  // State for adding new tests
  const [manuallyAddedTests, setManuallyAddedTests] = useState<string[]>([]);
  const [customUnits, setCustomUnits] = useState<Record<string, string>>({});
  const [isAddingTest, setIsAddingTest] = useState(false);
  const [newTestNameInput, setNewTestNameInput] = useState('');
  const [newTestUnitInput, setNewTestUnitInput] = useState('');

  // 1. Collect all unique test names across all logs + manually added ones + MANDATORY ones
  const derivedTestNames = logs.flatMap(log => log.labs.map(lab => lab.testName));
  const uniqueNames = Array.from(
    new Set([...MANDATORY_TEST_ORDER, ...derivedTestNames, ...manuallyAddedTests])
  );

  // 2. Sort test names based on mandatory order, then alphabetical
  const allTestNames: string[] = uniqueNames.sort((a, b) => {
    const indexA = MANDATORY_TEST_ORDER.indexOf(a);
    const indexB = MANDATORY_TEST_ORDER.indexOf(b);

    // If both are in the mandatory list, sort by the fixed order
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    // If only A is in the list, A comes first
    if (indexA !== -1) return -1;

    // If only B is in the list, B comes first
    if (indexB !== -1) return 1;

    // Otherwise sort alphabetically
    return a.localeCompare(b);
  });

  // 3. Sort logs by date (ascending for table left-to-right progression)
  const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Helper to determine change direction with clinical context
  const getChangeIndicator = (testName: string, currentVal: string, prevVal: string | undefined) => {
    if (!prevVal) return null;
    
    // Attempt to parse numbers (handling common formats like "12.5" or "1,200")
    const currNum = parseFloat(currentVal.replace(',', '.'));
    const prevNum = parseFloat(prevVal.replace(',', '.'));

    if (isNaN(currNum) || isNaN(prevNum)) return null;

    const diff = currNum - prevNum;
    if (Math.abs(diff) < 0.01) return <Minus size={10} className="text-gray-300 inline ml-0.5" />;

    const direction = CLINICAL_DIRECTION[testName];
    
    // Default Colors (Neutral)
    let upColor = "text-gray-500";
    let downColor = "text-gray-500";

    // Context Aware Colors
    if (direction === 'high_bad') {
       upColor = "text-red-500"; // Worsening
       downColor = "text-green-600"; // Improving
    } else if (direction === 'low_bad') {
       upColor = "text-green-600"; // Improving
       downColor = "text-red-500"; // Worsening
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
      const unit = customUnits[editingCell.testName];
      onUpdateValue(editingCell.logId, editingCell.testName, tempValue, unit);
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const handleAddNewTest = () => {
    if (newTestNameInput.trim()) {
        const name = newTestNameInput.trim();
        setManuallyAddedTests(prev => {
            if (prev.includes(name)) return prev;
            return [...prev, name];
        });
        if (newTestUnitInput.trim()) {
            setCustomUnits(prev => ({...prev, [name]: newTestUnitInput.trim()}));
        }
        setNewTestNameInput('');
        setNewTestUnitInput('');
        setIsAddingTest(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto border rounded-lg border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 bg-white text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-2 text-left font-bold text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-100 z-10 border-r min-w-[80px] max-w-[120px]">
                Exame
              </th>
              {sortedLogs.map(log => (
                <th key={log.id} className="px-2 py-2 text-center font-bold text-gray-600 whitespace-nowrap min-w-[70px]">
                  {new Date(log.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {allTestNames.map(testName => {
               return (
                <tr key={testName} className="hover:bg-gray-50 transition-colors">
                  <td className="px-2 py-1.5 font-medium text-gray-800 sticky left-0 bg-white border-r z-10 group truncate" title={testName}>
                    {TEST_ABBREVIATIONS[testName] || testName}
                  </td>
                  {sortedLogs.map((log, index) => {
                    const result = log.labs.find(l => l.testName === testName);
                    const isEditing = editingCell?.logId === log.id && editingCell?.testName === testName;
                    
                    // Get previous log's result for this test
                    const prevLog = index > 0 ? sortedLogs[index - 1] : null;
                    const prevResult = prevLog?.labs.find(l => l.testName === testName);

                    return (
                      <td 
                          key={log.id} 
                          className="px-1 py-1 text-center text-gray-700 cursor-pointer hover:bg-blue-50"
                          onClick={() => !isEditing && handleStartEdit(log.id, testName, result ? String(result.value) : '')}
                      >
                        {isEditing ? (
                          <input
                              autoFocus
                              type="text"
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              onBlur={handleSave}
                              onKeyDown={handleKeyDown}
                              className="w-full text-center text-xs border-b-2 border-medical-500 bg-white focus:outline-none p-0"
                          />
                        ) : (
                          <div className="flex items-center justify-center gap-0.5">
                            <span className="font-semibold">{result ? result.value : '-'}</span>
                            {/* Use String() to ensure safe conversion if value is number */}
                            {result && prevResult && getChangeIndicator(testName, String(result.value), String(prevResult.value))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  {/* Empty cells if no logs exist yet, just to keep row structure if needed, though header handles cols */}
                  {sortedLogs.length === 0 && <td className="px-2 py-1.5 text-center text-gray-400 italic"></td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add New Test Section */}
      <div className="p-2 border-t bg-gray-50 flex justify-end">
          {isAddingTest ? (
              <div className="flex items-center gap-2 max-w-sm w-full">
                  <input 
                      type="text" 
                      placeholder="Exame" 
                      value={newTestNameInput}
                      onChange={e => setNewTestNameInput(e.target.value)}
                      className="border rounded px-2 py-1 text-xs flex-1 outline-none focus:border-medical-500"
                      autoFocus
                  />
                  <input 
                      type="text" 
                      placeholder="Unid" 
                      value={newTestUnitInput}
                      onChange={e => setNewTestUnitInput(e.target.value)}
                      className="border rounded px-2 py-1 text-xs w-16 outline-none focus:border-medical-500"
                  />
                  <button onClick={handleAddNewTest} className="bg-medical-600 text-white p-1 rounded hover:bg-medical-700" title="Salvar">
                      <Save size={14} />
                  </button>
                  <button onClick={() => setIsAddingTest(false)} className="bg-gray-200 text-gray-600 p-1 rounded hover:bg-gray-300" title="Cancelar">
                      <X size={14} />
                  </button>
              </div>
          ) : (
            <button 
                onClick={() => setIsAddingTest(true)}
                className="flex items-center gap-1 text-medical-600 hover:text-medical-800 text-xs font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors"
            >
                <Plus size={14} /> Adicionar Exame
            </button>
          )}
      </div>
    </div>
  );
};

export default LabResultTable;