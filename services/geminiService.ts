
import { GoogleGenAI, Type } from "@google/genai";
import { Patient } from "../types";

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateClinicalSummary = async (patient: Patient): Promise<string> => {
  try {
    // Pegar os últimos 5 logs para uma análise mais profunda se disponível
    const recentLogs = patient.dailyLogs.slice(-5); 
    
    const prompt = `
      Atue como um residente sênior de medicina interna ou intensivista.
      Analise os dados do paciente a seguir e forneça um resumo clínico conciso e uma análise de tendências (máx. 150 palavras) em PORTUGUÊS.
      Concentre-se na evolução dos sinais vitais, balanço hídrico (se UTI), novas hipóteses diagnósticas e principais resultados laboratoriais.

      Paciente: ${patient.name}, ${patient.age} anos, ${patient.gender}, Leito ${patient.bedNumber}.
      Admissão: ${patient.admissionDate}
      Hipóteses Diagnósticas Atuais: ${patient.diagnosticHypotheses.join(', ')}
      Histórico: ${patient.admissionHistory}

      Registros Diários Recentes:
      ${JSON.stringify(recentLogs, null, 2)}

      Formate a saída como uma nota médica profissional e direta. Aponte sinais de alerta se existirem.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    return response.text || "Nenhum resumo gerado.";
  } catch (error) {
    console.error("Error generating clinical summary:", error);
    return "Não foi possível gerar o resumo da IA no momento. Verifique a conexão.";
  }
};

export const suggestHypotheses = async (symptoms: string, currentHypotheses: string[]): Promise<string[]> => {
  try {
    const prompt = `
      Dados os seguintes sintomas/observações: "${symptoms}"
      Hipóteses atuais: ${JSON.stringify(currentHypotheses)}
      
      Sugira 3-5 hipóteses diagnósticas adicionais ou diferenciais relevantes.
      Responda em PORTUGUÊS.
      Retorne APENAS um array JSON de strings.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        // Following @google/genai guidelines for structured JSON response
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text) as string[];
  } catch (error) {
    console.error("Error suggesting hypotheses:", error);
    return [];
  }
};
