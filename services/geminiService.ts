import { GoogleGenAI } from "@google/genai";
import { Patient } from "../types";

// Initialize the Gemini client
// Note: In a real production app, ensure API_KEY is set in your environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateClinicalSummary = async (patient: Patient): Promise<string> => {
  try {
    const recentLogs = patient.dailyLogs.slice(0, 3); // Last 3 days
    
    const prompt = `
      Atue como um residente sênior de medicina interna.
      Analise os dados do paciente a seguir e forneça um resumo clínico conciso e uma análise de tendências (máx. 150 palavras) em PORTUGUÊS.
      Concentre-se na evolução dos sinais vitais, novas hipóteses diagnósticas e principais resultados laboratoriais.

      Paciente: ${patient.name}, ${patient.age} anos, ${patient.gender}, Leito ${patient.bedNumber}.
      Admissão: ${patient.admissionDate}
      Hipóteses Diagnósticas Atuais: ${patient.diagnosticHypotheses.join(', ')}

      Registros Diários Recentes (Últimos 3):
      ${JSON.stringify(recentLogs, null, 2)}

      Formate a saída como um trecho de nota médica profissional.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Low latency preferred for UI interactions
      }
    });

    return response.text || "Nenhum resumo gerado.";
  } catch (error) {
    console.error("Error generating clinical summary:", error);
    return "Não foi possível gerar o resumo da IA neste momento. Verifique a configuração da sua chave de API.";
  }
};

export const suggestHypotheses = async (symptoms: string, currentHypotheses: string[]): Promise<string[]> => {
  try {
    const prompt = `
      Dados os seguintes sintomas/observações relatados: "${symptoms}"
      E hipóteses atuais: ${JSON.stringify(currentHypotheses)}
      
      Sugira 3-5 hipóteses diagnósticas adicionais ou diagnósticos diferenciais a serem considerados.
      Responda em PORTUGUÊS.
      Retorne APENAS um array JSON de strings.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) return [];
    
    // Parse JSON
    return JSON.parse(text) as string[];
  } catch (error) {
    console.error("Error suggesting hypotheses:", error);
    return [];
  }
};