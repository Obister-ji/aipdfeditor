import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // A check to ensure the API key is available.
  // In a real app, this would be handled by the environment.
  console.warn("Gemini API key not found. Summarization feature will not work.");
  throw new Error("Gemini API key is missing. Please configure it in the environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function summarizePdfText(text: string): Promise<string> {
  if (!API_KEY) {
    return "Gemini API key is not configured. Cannot summarize.";
  }
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `Please provide a concise summary of the following document text. Focus on the key points, main arguments, and any important conclusions. Format the output clearly.\n\nDOCUMENT TEXT:\n"""\n${text}\n"""`;
    
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    if (!response || !response.text) {
      throw new Error("Malformed response from Gemini API.");
    }
    
    return response.text;

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to get summary from Gemini API. Please check the API key and try again.');
  }
}
