import React from 'react';
import { Patient, DailyLog } from '../types';
import { X, Printer } from 'lucide-react';

// Reusing abbreviations for consistency in print view
const TEST_ABBREVIATIONS: Record<string, string> = {
  'Sódio': 'Na+', 'Potássio': 'K+', 'Ureia': 'Ur', 'Creatinina': 'Cr',
  'Hemoglobina': 'Hb', 'Hematócrito': 'Ht', 'Leucócitos': 'Leuco', 'Plaquetas': 'Plq',
  'PCR': 'PCR', 'aPTT': 'aPTT', 'INR': 'INR', 'pH': 'pH', 'pO2': 'pO2',
  'pCO2': 'pCO2', 'Bicarbonato': 'BIC', 'SatO2': 'Sat', 'Lactato': 'Lac',
  'Troponina': 'Trop', 'Dímero-D': 'DD', 'Magnésio': 'Mg', 'Cálcio': 'Ca',
  'Fósforo': 'P', 'Glicemia': 'Glic', 'Procalcitonina': 'Procal'
};

const getAbbreviatedTestName = (name: string) => TEST_ABBREVIATIONS[name] || name.substring(0, 4);

interface PatientPrintViewProps {
  patient: Patient;
  onClose: () => void;
}

export const PatientPrintView: React.FC<PatientPrintViewProps> = ({ patient, onClose }) => {
  // Sort logs by date descending
  const logs = [...patient.dailyLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recentLogs = logs.slice(0, 5); // Last 5 days for print

  return (
    <div className="fixed inset-0 bg-gray-900/50 z-[60] flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:block">
      <div className="bg-white shadow-2xl rounded-xl w-full max-w-4xl h-[90vh] flex flex-col print:shadow-none print:w-full print:h-auto print:max-w-none print:rounded-none">
        
        {/* Screen Only Header */}
        <div className="flex justify-between items-center p-4 border-b print:hidden">
           <h2 className="font-bold text-lg text-gray-800">Visualização de Impressão</h2>
           <div className="flex gap-2">
              <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                <Printer size={18} /> Imprimir
              </button>
              <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded">
                <X size={24} />
              </button>
           </div>
        </div>

        {/* Print Content */}
        <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible font-serif">
           
           {/* Header */}
           <div className="border-b-2 border-gray-800 pb-4 mb-6 flex justify-between items-end">
              <div>
                 <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">Ficha de Evolução Diária</h1>
                 <p className="text-sm text-gray-600">CardioEDAD - Monitoramento Clínico</p>
              </div>
              <div className="text-right">
                 <p className="font-bold text-lg">{patient.name}</p>
                 <p className="text-sm">Leito: {patient.bedNumber} | Reg: {patient.id.slice(0,8)}</p>
              </div>
           </div>

           {/* Patient Info Grid */}
           <div className="grid grid-cols-4 gap-4 mb-6 text-sm border p-4 rounded bg-gray-50 print:bg-transparent">
              <div><strong>Idade:</strong> {patient.age} anos</div>
              <div><strong>Sexo:</strong> {patient.gender}</div>
              <div><strong>Peso Est:</strong> {patient.estimatedWeight} kg</div>
              <div><strong>Admissão:</strong> {new Date(patient.admissionDate).toLocaleDateString('pt-BR')}</div>
              <div className="col-span-4"><strong>Diagnósticos:</strong> {patient.diagnosticHypotheses.join(', ')}</div>
           </div>

           {/* Latest Vitals & Status */}
           {recentLogs.length > 0 ? (
             <div className="mb-6">
                <h3 className="font-bold text-gray-800 border-b mb-2 uppercase text-sm">Último Registro ({new Date(recentLogs[0].date).toLocaleDateString('pt-BR')})</h3>
                <div className="grid grid-cols-6 gap-2 text-center text-sm mb-4">
                   <div className="border p-1"><span className="block text-xs text-gray-500">PA</span>{recentLogs[0].vitalSigns.bloodPressureSys}/{recentLogs[0].vitalSigns.bloodPressureDia}</div>
                   <div className="border p-1"><span className="block text-xs text-gray-500">FC</span>{recentLogs[0].vitalSigns.heartRate}</div>
                   <div className="border p-1"><span className="block text-xs text-gray-500">FR</span>{recentLogs[0].vitalSigns.respiratoryRate}</div>
                   <div className="border p-1"><span className="block text-xs text-gray-500">Temp</span>{recentLogs[0].vitalSigns.temperature}</div>
                   <div className="border p-1"><span className="block text-xs text-gray-500">SatO2</span>{recentLogs[0].vitalSigns.oxygenSaturation}%</div>
                   <div className="border p-1"><span className="block text-xs text-gray-500">HGT</span>{recentLogs[0].vitalSigns.capillaryBloodGlucose}</div>
                </div>
                
                <div className="mb-4">
                   <h4 className="font-bold text-sm mb-1">Evolução/Notas:</h4>
                   <p className="text-sm text-justify whitespace-pre-wrap border p-2 min-h-[100px]">{recentLogs[0].notes}</p>
                </div>
             </div>
           ) : (
             <p className="italic text-gray-500 mb-6">Sem registros diários.</p>
           )}

           {/* Prescription */}
           <div className="mb-6">
              <h3 className="font-bold text-gray-800 border-b mb-2 uppercase text-sm">Prescrição Médica Atual</h3>
              <div className="text-sm border p-4 min-h-[150px]">
                 {patient.medicalPrescription ? (
                    <pre className="whitespace-pre-wrap font-sans">{patient.medicalPrescription}</pre>
                 ) : (
                    <p className="italic text-gray-400">Sem prescrição vigente.</p>
                 )}
              </div>
           </div>

           {/* ICU Specifics */}
           {patient.unit === 'UTI' && (
             <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                   <h3 className="font-bold text-gray-800 border-b mb-2 uppercase text-xs">Drogas Vasoativas / Sedação</h3>
                   <div className="text-sm border p-2 min-h-[60px]">
                      <p><strong>DVA:</strong> {patient.vasoactiveDrugs || 'Negativo'}</p>
                      <p><strong>Sedação:</strong> {patient.sedationAnalgesia || 'Negativo'}</p>
                   </div>
                </div>
                <div>
                   <h3 className="font-bold text-gray-800 border-b mb-2 uppercase text-xs">Invasões / Balanço Hídrico</h3>
                   <div className="text-sm border p-2 min-h-[60px]">
                      <p><strong>Dispositivos:</strong> {patient.devices || 'Nenhum'}</p>
                      {recentLogs[0]?.fluidBalance && (
                         <p><strong>BH (24h):</strong> {recentLogs[0].fluidBalance.net > 0 ? '+' : ''}{recentLogs[0].fluidBalance.net} ml</p>
                      )}
                   </div>
                </div>
             </div>
           )}

           {/* Space for signatures */}
           <div className="mt-12 grid grid-cols-2 gap-12 pt-12">
               <div className="border-t border-black text-center text-sm pt-2">Assinatura do Médico</div>
               <div className="border-t border-black text-center text-sm pt-2">Assinatura da Enfermagem</div>
           </div>
        </div>
      </div>
    </div>
  );
};

interface PatientListPrintViewProps {
  patients: Patient[];
  unit: string;
  onClose: () => void;
}

export const PatientListPrintView: React.FC<PatientListPrintViewProps> = ({ patients, unit, onClose }) => {
  // Helper to get formatted last labs string
  const getLastLabsString = (patient: Patient) => {
    if (patient.dailyLogs.length === 0) return '-';
    // Get latest log
    const lastLog = patient.dailyLogs.reduce((prev, current) => 
        new Date(prev.date) > new Date(current.date) ? prev : current
    );

    if (!lastLog.labs || lastLog.labs.length === 0) return '-';

    // Filter relevant labs to save space and format
    // Priority: Hb, Leuco, Plq, Cr, Ur, Na, K, PCR, Lac
    const priority = ['Hemoglobina', 'Leucócitos', 'Plaquetas', 'Creatinina', 'Ureia', 'Sódio', 'Potássio', 'PCR', 'Lactato'];
    
    // Sort labs by priority
    const sortedLabs = [...lastLog.labs].sort((a, b) => {
        const idxA = priority.indexOf(a.testName);
        const idxB = priority.indexOf(b.testName);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
    });

    return sortedLabs.map(l => {
        const abbr = getAbbreviatedTestName(l.testName);
        return `${abbr}:${l.value}`; // No Unit
    }).join('  ');
  };

  const calculateDays = (dateStr: string) => {
      const start = new Date(dateStr);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  };

  const getPendingConducts = (patient: Patient) => {
     const pending = patient.dailyLogs.flatMap(l => l.conducts.filter(c => !c.verified));
     if (pending.length === 0) return null;
     return pending.map(c => `• ${c.description}`).join(' ');
  };

  const getLastVitals = (patient: Patient) => {
    if (patient.dailyLogs.length === 0) return null;
    const lastLog = patient.dailyLogs.reduce((prev, current) => 
        new Date(prev.date) > new Date(current.date) ? prev : current
    );
    const v = lastLog.vitalSigns;
    return `PA:${v.bloodPressureSys}/${v.bloodPressureDia} FC:${v.heartRate} Sat:${v.oxygenSaturation}%`;
  };

  // Determine if we are in ICU mode based on the passed 'unit' prop (which comes from activeTab)
  const isICU = unit === 'UTI';

  return (
    <div className="fixed inset-0 bg-gray-900/50 z-[60] flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:block">
       <div className="bg-white shadow-2xl rounded-xl w-full max-w-[95vw] h-[90vh] flex flex-col print:shadow-none print:w-full print:h-auto print:max-w-none print:rounded-none">
          
          {/* Screen Only Header */}
          <div className="flex justify-between items-center p-4 border-b print:hidden">
             <h2 className="font-bold text-lg text-gray-800">Lista de Passagem de Plantão</h2>
             <div className="flex gap-2">
                <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  <Printer size={18} /> Imprimir Lista
                </button>
                <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded">
                  <X size={24} />
                </button>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 print:p-0 print:overflow-visible bg-white">
             {/* Print Header */}
             <div className="mb-4 border-b border-black pb-2 flex justify-between items-end">
                <div>
                    <h1 className="text-xl font-bold uppercase tracking-tight text-black">Passagem de Plantão - {unit}</h1>
                    <p className="text-xs text-gray-600">CardioEDAD • {new Date().toLocaleDateString('pt-BR', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}</p>
                </div>
                <div className="text-right text-xs">
                    Total: {patients.length} pacientes
                </div>
             </div>

             {/* Print Table Layout - High Density */}
             <table className="w-full text-left border-collapse border border-black text-[10px] leading-tight font-sans">
                <thead>
                    <tr className="bg-gray-100 print:bg-gray-200">
                        <th className="border border-black p-1 w-[40px] text-center">Leito</th>
                        <th className="border border-black p-1 w-[25%]">Paciente / Diagnóstico</th>
                        {/* Dynamic Column Header */}
                        <th className="border border-black p-1 w-[20%]">
                            {isICU ? 'Suporte / Invasões' : 'Prescrição Atual'}
                        </th>
                        <th className="border border-black p-1 w-[30%]">Laboratório (Último)</th>
                        <th className="border border-black p-1 w-[20%]">Pendências / Plano</th>
                    </tr>
                </thead>
                <tbody>
                    {patients.map((patient, idx) => {
                        const lastVitals = getLastVitals(patient);
                        const labsString = getLastLabsString(patient);
                        const pendingString = getPendingConducts(patient);

                        return (
                            <tr key={patient.id} className="break-inside-avoid">
                                {/* Bed */}
                                <td className="border border-black p-1 text-center font-bold text-xs align-top bg-gray-50">
                                    {patient.bedNumber}
                                </td>
                                
                                {/* Patient Info */}
                                <td className="border border-black p-1 align-top">
                                    <div className="font-bold text-[11px] uppercase">{patient.name}</div>
                                    <div className="mb-1">{patient.age} anos • {patient.gender.charAt(0)} • {calculateDays(patient.admissionDate)}º DIH</div>
                                    <div className="font-semibold text-gray-800">HD: {patient.diagnosticHypotheses[0] || '?'}</div>
                                    {patient.diagnosticHypotheses.length > 1 && (
                                        <div className="text-gray-600 truncate">{patient.diagnosticHypotheses.slice(1).join(', ')}</div>
                                    )}
                                </td>

                                {/* Dynamic Content: Support (ICU) OR Prescription (Ward) */}
                                <td className="border border-black p-1 align-top">
                                    {/* Always show vitals if available */}
                                    {lastVitals && <div className="mb-1 font-semibold border-b border-gray-200 pb-1">{lastVitals}</div>}
                                    
                                    {isICU ? (
                                        // ICU Content
                                        <>
                                            {patient.vasoactiveDrugs && (
                                                <div className="text-red-700 font-bold mb-0.5">DVA: {patient.vasoactiveDrugs.split('\n')[0]}</div>
                                            )}
                                            {patient.sedationAnalgesia && (
                                                <div className="text-blue-700 mb-0.5">Sed: {patient.sedationAnalgesia.split('\n')[0]}</div>
                                            )}
                                            {patient.devices && <div className="italic text-gray-700">{patient.devices}</div>}
                                        </>
                                    ) : (
                                        // Ward Content (Medical Prescription)
                                        <div className="text-[9px] leading-tight text-gray-800">
                                            {patient.medicalPrescription ? (
                                                <ul className="list-inside">
                                                    {patient.medicalPrescription
                                                        .split('\n')
                                                        .filter(line => line.trim() !== '' && !line.startsWith('~~')) // Filter out struck-through items
                                                        .slice(0, 8) // Limit lines to fit table
                                                        .map((line, i) => (
                                                            <li key={i} className="truncate">• {line.replace(/^\d+\.\s*/, '')}</li>
                                                        ))
                                                    }
                                                    {patient.medicalPrescription.split('\n').filter(l => l.trim() !== '' && !l.startsWith('~~')).length > 8 && (
                                                        <li className="italic text-gray-500 pl-2">...</li>
                                                    )}
                                                </ul>
                                            ) : (
                                                <span className="text-gray-400 italic">- Sem prescrição -</span>
                                            )}
                                        </div>
                                    )}
                                </td>

                                {/* Labs */}
                                <td className="border border-black p-1 align-top">
                                    <div className="font-mono text-[9px] tracking-tight text-gray-800 break-words">
                                        {labsString}
                                    </div>
                                </td>

                                {/* Pending / Plan */}
                                <td className="border border-black p-1 align-top bg-yellow-50/50 print:bg-transparent">
                                    {pendingString ? (
                                        <div className="font-bold text-red-700 mb-1">{pendingString}</div>
                                    ) : (
                                        <div className="text-gray-400 italic mb-1">- ok -</div>
                                    )}
                                    {/* Small space for manual notes */}
                                    <div className="mt-2 pt-2 border-t border-dotted border-gray-400 h-[20px]"></div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
             </table>
             
             {patients.length === 0 && <p className="text-center italic mt-4">Nenhum paciente listado.</p>}
          </div>
       </div>
    </div>
  );
};