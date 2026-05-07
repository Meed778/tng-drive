import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function checkContent(text: string): Promise<{ isFlagged: boolean; reason: string }> {
  const prompt = `You are an automated content moderation AI. Analyze the following text and determine if it contains profanity, hate speech, inappropriate content, or policy violations.
If it is completely safe, return a JSON object with {"isFlagged": false, "reason": ""}.
If it is unsafe, return {"isFlagged": true, "reason": "<brief explanation of why it was flagged>"}.

Text to analyze: "${text}"`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      isFlagged: result.isFlagged || false,
      reason: result.reason || ''
    };
  } catch (err) {
    console.error("Moderation AI error", err);
    // Fail safe: flag and require human review if moderation fails
    return { isFlagged: true, reason: "Automated moderation failed, requires human review." };
  }
}
