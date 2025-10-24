import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (!API_KEY) {
  // Do not throw during module load — that breaks apps that import this module.
  // Keep a warning and make the summarizer return a friendly message when used.
  console.warn("Gemini API key not found. Summarization feature will be disabled.");
} else {
  ai = new GoogleGenAI({ apiKey: API_KEY });
}

export async function summarizePdfText(text: string): Promise<string> {
  if (!API_KEY || !ai) {
    return "Gemini API key is not configured. Summarization is disabled in this environment.";
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
    return 'Failed to get summary from Gemini API. Please check the API key and try again.';
  }
}
