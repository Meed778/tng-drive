import { GoogleGenAI } from '@google/genai';

let genAI: GoogleGenAI | null = null;

function getGenAI() {
  if (!genAI) {
    const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || (process as any).env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export const getGeminiModel = (modelName: string = "gemini-1.5-flash") => {
  return (getGenAI() as any).getGenerativeModel({ model: modelName });
};

export async function extractCarDataFromImage(imageFile: File | string) {
  const model = getGeminiModel();
  
  let parts: any[] = [];
  
  if (typeof imageFile === 'string') {
    // If it's a URL, we need to fetch it or just use it as a prompt if the model supports it.
    // Actually, for URLs, we should probably fetch them first or just stick to Files for now.
    // But let's handle it as a descriptive prompt for now if it's a URL.
    parts = [
      { text: `Analyze this car image URL and extract its details: ${imageFile}` }
    ];
  } else {
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve) => {
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(imageFile);
    });
    
    const base64 = await base64Promise;
    parts = [
      {
        inlineData: {
          mimeType: imageFile.type,
          data: base64
        }
      },
      { text: "Extract car details from this image. Return JSON ONLY with keys: brand, model, year, category (one of: Luxury المتميزة, عائلية SUV, اقتصادية, رياضية), pricePerDay (estimate if not visible, e.g. 1000), engine, transmission (أوتوماتيكي or يدوي), caution (estimate, e.g. 5000), description (short marketing text in Arabic)." }
    ];
  }

  const result = await model.generateContent({
    contents: [{ role: 'user', parts }]
  });

  const responseText = result.response.text();
  // Extract JSON from potential markdown code blocks
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error("Could not extract structured data");
}
