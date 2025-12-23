
import React from 'react';
import { Patient, DailyLog } from '../types';
import { X, Printer } from 'lucide-react';

const TEST_ABBREVIATIONS: Record<string, string> = {
  'Sódio': 'Na+', 'Potássio': 'K+', 'Ureia': 'Ur', 'Creatinina': 'Cr',
  'Hemoglobina': 'Hb', 'Hematócrito': 'Ht', 'Leucócitos': 'Leuco', 'Plaquetas': 'Plq',
  'PCR': 'PCR', 'aPTT': 'aPTT', 'INR': 'INR', 'pH': 'pH', 'pO2': 'pO2',
  'pCO2': 'pCO2', 'Bicarbonato': 'BIC', 'SatO2': 'Sat', 'Lactato': 'Lac',
  'Troponina': 'Trop', 'Dímero-D': 'DD', 'Magnésio': 'Mg', 'Cálcio': 'Ca',
  'Fósforo': 'P', 'Glicemia': 'Glic', 'Procalcitonina': 'Procal'
};

const getAbbreviatedTestName = (name: string) => TEST_ABBREVIATIONS[name] || String(name).substring(0, 4);

const safeString = (val: any): string => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return '';
  return String(val);
};

interface PatientPrintViewProps {
  patient: Patient;
  onClose: () => void;
}

export const PatientPrintView: React.FC<PatientPrintViewProps> = ({ patient, onClose }) => {
  const logs = [...patient.dailyLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recentLogs = logs.slice(0, 5);

  return (
    <div className="fixed inset-0 bg-gray-900/50 z-[60] flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:block">
      <div className="bg-white shadow-2xl rounded-xl w-full max-w-4xl h-[90vh] flex flex-col print:shadow-none print:w-full print:h-auto print:max-w-none print:rounded-none">
        <div className="flex justify-between items-center p-4 border-b print:hidden">
           <h2 className="font-bold text-lg text-gray-800">Impressão - Evolução</h2>
           <div className="flex gap-2">
              <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded">
                <Printer size={18} /> Imprimir
              </button>
              <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded">
                <X size={24} />
              </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible font-serif">
           <div className="border-b-2 border-gray-800 pb-4 mb-6 flex justify-between items-end">
              <div>
                 <h1 className="text-2xl font-bold text-gray-900 uppercase">Ficha de Evolução Diária</h1>
                 <p className="text-sm text-gray-600">CardioEDAD - Sistema de Monitoramento</p>
              </div>
              <div className="text-right">
                 <p className="font-bold text-lg">{safeString(patient.name)}</p>
                 <p className="text-sm">Leito: {safeString(patient.bedNumber)} | DIH: {recentLogs.length} dias</p>
              </div>
           </div>

           <div className="grid grid-cols-4 gap-4 mb-6 text-sm border p-4 rounded bg-gray-50 print:bg-transparent">
              <div><strong>Idade:</strong> {patient.age}a</div>
              <div><strong>Sexo:</strong> {safeString(patient.gender)}</div>
              <div><strong>Peso:</strong> {patient.estimatedWeight}kg</div>
              <div><strong>Admissão:</strong> {new Date(patient.admissionDate).toLocaleDateString('pt-BR')}</div>
              <div className="col-span-4"><strong>Diagnósticos:</strong> {patient.diagnosticHypotheses.join(', ')}</div>
           </div>

           {recentLogs.length > 0 ? (
             <div className="mb-6">
                <h3 className="font-bold text-gray-800 border-b mb-2 uppercase text-sm">Registro de {new Date(recentLogs[0].date).toLocaleDateString('pt-BR')}</h3>
                <div className="grid grid-cols-6 gap-2 text-center text-sm mb-4">
                   <div className="border p-1"><span className="block text-[10px] text-gray-500">PA</span>{safeString(recentLogs[0].vitalSigns.bloodPressureSys)}/{safeString(recentLogs[0].vitalSigns.bloodPressureDia)}</div>
                   <div className="border p-1"><span className="block text-[10px] text-gray-500">FC</span>{safeString(recentLogs[0].vitalSigns.heartRate)}</div>
                   <div className="border p-1"><span className="block text-[10px] text-gray-500">SatO2</span>{safeString(recentLogs[0].vitalSigns.oxygenSaturation)}%</div>
                   <div className="border p-1"><span className="block text-[10px] text-gray-500">Temp</span>{safeString(recentLogs[0].vitalSigns.temperature)}°</div>
                   <div className="border p-1"><span className="block text-[10px] text-gray-500">FR</span>{safeString(recentLogs[0].vitalSigns.respiratoryRate)}</div>
                   <div className="border p-1"><span className="block text-[10px] text-gray-500">HGT</span>{safeString(recentLogs[0].vitalSigns.capillaryBloodGlucose)}</div>
                </div>
                {patient.ventilation && (
                  <div className="grid grid-cols-6 gap-2 text-center text-[11px] mb-4 bg-teal-50 p-2 border border-teal-100 print:bg-transparent">
                    <div><span className="block font-bold text-teal-800 uppercase">Suporte</span>{safeString(patient.ventilation.mode)}</div>
                    <div><span className="block font-bold text-teal-800 uppercase">FIO2</span>{safeString(patient.ventilation.fio2)}%</div>
                    <div><span className="block font-bold text-teal-800 uppercase">PEEP/E</span>{safeString(patient.ventilation.peep)}</div>
                    <div><span className="block font-bold text-teal-800 uppercase">FR V.</span>{safeString(patient.ventilation.rate)}</div>
                    <div><span className="block font-bold text-teal-800 uppercase">VOL.</span>{safeString(patient.ventilation.volume)}</div>
                    <div><span className="block font-bold text-teal-800 uppercase">PRES.</span>{safeString(patient.ventilation.pressure)}</div>
                  </div>
                )}
                <div className="mb-4">
                   <h4 className="font-bold text-sm mb-1">Notas Clínicas:</h4>
                   <p className="text-sm text-justify whitespace-pre-wrap border p-2 min-h-[120px]">{safeString(recentLogs[0].notes)}</p>
                </div>
             </div>
           ) : <p className="italic text-gray-500">Sem registros diários.</p>}

           <div className="mb-6">
              <h3 className="font-bold text-gray-800 border-b mb-2 uppercase text-sm">Prescrição Vigente</h3>
              <div className="text-sm border p-4 min-h-[150px]">
                 <pre className="whitespace-pre-wrap font-sans text-xs">{safeString(patient.medicalPrescription) || 'Nenhuma registrada.'}</pre>
              </div>
           </div>

           <div className="mt-12 grid grid-cols-2 gap-12 pt-12">
               <div className="border-t border-black text-center text-xs pt-2">Assinatura do Médico Responsável</div>
               <div className="border-t border-black text-center text-xs pt-2">Assinatura da Enfermagem</div>
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
  const getLastLabsString = (patient: Patient) => {
    if (patient.dailyLogs.length === 0) return '-';
    const sortedLogs = [...patient.dailyLogs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastLog = sortedLogs[0];
    if (!lastLog.labs || lastLog.labs.length === 0) return '-';
    const priority = ['Hemoglobina', 'Leucócitos', 'Plaquetas', 'Creatinina', 'Ureia', 'Sódio', 'Potássio', 'PCR', 'Lactato'];
    const sortedLabs = [...lastLog.labs].sort((a, b) => {
        const idxA = priority.indexOf(a.testName);
        const idxB = priority.indexOf(b.testName);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
    });
    return sortedLabs.map(l => `${getAbbreviatedTestName(safeString(l.testName))}:${safeString(l.value)}`).join(' ');
  };

  const getRespiratorySummary = (patient: Patient) => {
    if (!patient.ventilation) return 'Ar Ambiente';
    const v = patient.ventilation;
    if (v.mode === 'Espontânea') return 'Ar Ambiente';
    if (v.mode === 'Cateter/CNAF') return `${v.mode} ${safeString(v.flow)}L (Fi:${safeString(v.fio2)}%)`;
    return `${safeString(v.mode)} ${safeString(v.subMode)} (Fi:${safeString(v.fio2)}% P:${safeString(v.peep)})`;
  };

  const calculateDays = (dateStr: string) => {
      const start = new Date(dateStr);
      const diffTime = Math.abs(new Date().getTime() - start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 z-[60] flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:block">
       <div className="bg-white shadow-2xl rounded-xl w-full max-w-[95vw] h-[90vh] flex flex-col print:shadow-none print:w-full print:h-auto print:max-w-none print:rounded-none">
          <div className="flex justify-between items-center p-4 border-b print:hidden">
             <h2 className="font-bold text-lg text-gray-800">Lista de Passagem de Plantão</h2>
             <div className="flex gap-2">
                <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded">Imprimir Lista</button>
                <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded"><X size={24} /></button>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 print:p-0 bg-white">
             <div className="mb-4 border-b-2 border-black pb-2 flex justify-between items-end">
                <div><h1 className="text-xl font-bold uppercase tracking-tight">Censo de Plantão - {unit}</h1><p className="text-[10px] text-gray-600 uppercase">CardioEDAD • {new Date().toLocaleDateString('pt-BR')}</p></div>
                <div className="text-xs">Total: {patients.length} pacientes</div>
             </div>
             <table className="w-full text-left border-collapse border border-black text-[9px] leading-tight font-sans">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border border-black p-1 w-[35px] text-center">Leito</th>
                        <th className="border border-black p-1 w-[22%]">Paciente / HD</th>
                        <th className="border border-black p-1 w-[18%]">Suporte / Invasões</th>
                        <th className="border border-black p-1 w-[32%]">Laboratório Recente</th>
                        <th className="border border-black p-1 w-[20%]">Pendências / Plano</th>
                    </tr>
                </thead>
                <tbody>
                    {patients.map(patient => (
                        <tr key={patient.id} className="break-inside-avoid">
                            <td className="border border-black p-1 text-center font-bold text-xs align-top">{safeString(patient.bedNumber)}</td>
                            <td className="border border-black p-1 align-top">
                                <div className="font-bold uppercase text-[10px]">{safeString(patient.name)}</div>
                                <div>{patient.age}a • {calculateDays(patient.admissionDate)}º DIH</div>
                                <div className="font-semibold text-gray-700 mt-1">HD: {safeString(patient.diagnosticHypotheses[0]) || '?'}</div>
                            </td>
                            <td className="border border-black p-1 align-top">
                                <div className="font-bold text-teal-800 mb-0.5">{getRespiratorySummary(patient)}</div>
                                {patient.vasoactiveDrugs && <div className="text-red-700 font-bold mb-0.5 truncate">DVA: {safeString(patient.vasoactiveDrugs).split('\n')[0]}</div>}
                                {patient.devices_list && patient.devices_list.length > 0 && <div className="italic text-[8px] text-gray-500">{safeString(patient.devices_list[0].name)} ({new Date(patient.devices_list[0].insertionDate).toLocaleDateString('pt-BR')})</div>}
                            </td>
                            <td className="border border-black p-1 align-top font-mono text-[8px] break-all">{getLastLabsString(patient)}</td>
                            <td className="border border-black p-1 align-top bg-yellow-50/50 print:bg-transparent min-h-[40px]">
                                {patient.dailyLogs.flatMap(l => l.conducts).filter(c => !c.verified).slice(0, 3).map((c, i) => (
                                    <div key={i} className="font-bold text-red-600">• {safeString(c.description)}</div>
                                ))}
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );
};
