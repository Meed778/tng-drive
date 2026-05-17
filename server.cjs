var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_vite = require("vite");
var import_resend = require("resend");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_meta = {};
import_dotenv.default.config();
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "50mb" }));
  const resend = process.env.RESEND_API_KEY ? new import_resend.Resend(process.env.RESEND_API_KEY) : null;
  const ai = process.env.GEMINI_API_KEY ? new import_genai.GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  }) : null;
  app.get("/api/ai/health", (req, res) => {
    res.json({
      configured: !!ai,
      model: "gemini-3-flash-preview"
    });
  });
  app.post("/api/ai/extract", async (req, res) => {
    if (!ai) {
      console.error("Gemini API key missing in environment");
      return res.status(500).json({ error: "Gemini API key not configured" });
    }
    try {
      const { imageBase64, mimeType } = req.body;
      console.log(`[AI Extract] Starting extraction for ${mimeType}`);
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || "image/jpeg",
                data: imageBase64
              }
            },
            { text: "Extract car details from this image. Return JSON ONLY with keys: brand, model, year, category (one of: Luxury \u0627\u0644\u0645\u062A\u0645\u064A\u0632\u0629, \u0639\u0627\u0626\u0644\u064A\u0629 SUV, \u0627\u0642\u062A\u0635\u0627\u062F\u064A\u0629, \u0631\u064A\u0627\u0636\u064A\u0629), pricePerDay (estimate if not visible, e.g. 1000), engine, transmission (\u0623\u0648\u062A\u0648\u0645\u0627\u062A\u064A\u0643\u064A or \u064A\u062F\u0648\u064A), caution (estimate, e.g. 5000), description (short marketing text in Arabic)." }
          ]
        }
      });
      console.log("[AI Extract] Response received");
      const responseText = response.text;
      if (!responseText) throw new Error("Empty response from AI");
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return res.json(JSON.parse(jsonMatch[0]));
      }
      res.status(422).json({ error: "Could not extract structured data" });
    } catch (err) {
      console.error("AI Extraction Error:", err);
      res.status(500).json({ error: err.message || "Failed to process image with AI" });
    }
  });
  app.post("/api/ai/chat", async (req, res) => {
    if (!ai) return res.status(500).json({ error: "Gemini API key not configured" });
    try {
      const { messages, history } = req.body;
      console.log(`[AI Chat] Received message with ${history?.length || 0} history items`);
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...history || [],
          { role: "user", parts: messages }
        ],
        config: {
          systemInstruction: "\u0623\u0646\u062A \u0645\u0633\u0627\u0639\u062F \u0630\u0643\u064A \u0644\u0645\u062F\u064A\u0631 \u062A\u0637\u0628\u064A\u0642 \u062A\u0623\u062C\u064A\u0631 \u0633\u064A\u0627\u0631\u0627\u062A \u0641\u062E\u0645\u0629 \u0641\u064A \u0627\u0644\u0645\u063A\u0631\u0628. \n\u0639\u0646\u062F \u0627\u0633\u062A\u0644\u0627\u0645 \u0635\u0648\u0631\u0629 \u0633\u064A\u0627\u0631\u0629\u060C \u0642\u0645 \u0628\u0627\u0633\u062A\u062E\u0631\u0627\u062C \u062A\u0641\u0627\u0635\u064A\u0644\u0647\u0627 (\u0627\u0644\u0645\u0627\u0631\u0643\u0629\u060C \u0627\u0644\u0645\u0648\u062F\u064A\u0644\u060C \u0627\u0644\u0633\u0646\u0629\u060C \u0627\u0644\u0641\u0626\u0629\u060C \u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u0645\u0642\u062A\u0631\u062D\u060C \u0627\u0644\u0645\u062D\u0631\u0643\u060C \u0646\u0627\u0642\u0644 \u0627\u0644\u062D\u0631\u0643\u0629\u060C \u0627\u0644\u0636\u0645\u0627\u0646\u060C \u0648\u0627\u0644\u0648\u0635\u0641). \n\u0627\u0639\u0631\u0636 \u0647\u0630\u0647 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0644\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0623\u0648\u0644\u0627\u064B \u0641\u064A \u0631\u0633\u0627\u0644\u0629 \u0648\u0627\u0636\u062D\u0629 \u0648\u0645\u0646\u0633\u0642\u0629 \u0648\u0627\u0633\u0623\u0644\u0647 \u0625\u0630\u0627 \u0643\u0627\u0646\u062A \u0635\u062D\u064A\u062D\u0629 \u0623\u0648 \u0625\u0630\u0627 \u0643\u0627\u0646 \u064A\u0631\u064A\u062F \u062A\u0639\u062F\u064A\u0644 \u0623\u064A \u0645\u0646\u0647\u0627. \n\u0644\u0627 \u062A\u0642\u0645 \u0628\u0627\u0633\u062A\u062F\u0639\u0627\u0621 \u0623\u062F\u0627\u0629 addCarToDatabase \u0623\u0628\u062F\u0627\u064B \u0625\u0644\u0627 \u0628\u0639\u062F \u0623\u0646 \u064A\u0637\u0644\u0628 \u0645\u0646\u0643 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0630\u0644\u0643 \u0635\u0631\u0627\u062D\u0629 (\u0645\u062B\u0644\u0627\u064B: '\u0623\u0636\u0641\u0647\u0627'\u060C '\u062A\u0645'\u060C '\u0627\u062D\u0641\u0638\u0647\u0627'). \n\u0625\u0630\u0627 \u0637\u0644\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u062A\u0639\u062F\u064A\u0644 \u0623\u064A \u0645\u0639\u0644\u0648\u0645\u0629\u060C \u0642\u0645 \u0628\u062A\u062D\u062F\u064A\u062B \u0628\u064A\u0627\u0646\u0627\u062A\u0643 \u0648\u0627\u0639\u0631\u0636\u0647\u0627 \u0645\u062C\u062F\u062F\u0627\u064B \u0644\u0644\u062A\u0623\u0643\u064A\u062F. \n\u0627\u062C\u0639\u0644 \u0627\u0644\u0648\u0635\u0641 \u062C\u0630\u0627\u0628\u0627\u064B \u0648\u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629.",
          tools: [{
            functionDeclarations: [{
              name: "addCarToDatabase",
              description: "Adds a new car to the rental database based on extracted details.",
              parameters: {
                type: import_genai.Type.OBJECT,
                properties: {
                  brand: { type: import_genai.Type.STRING },
                  model: { type: import_genai.Type.STRING },
                  year: { type: import_genai.Type.NUMBER },
                  category: { type: import_genai.Type.STRING },
                  pricePerDay: { type: import_genai.Type.NUMBER },
                  engine: { type: import_genai.Type.STRING },
                  transmission: { type: import_genai.Type.STRING },
                  caution: { type: import_genai.Type.NUMBER },
                  description: { type: import_genai.Type.STRING }
                },
                required: ["brand", "model", "year", "category", "pricePerDay", "engine", "transmission", "caution", "description"]
              }
            }]
          }]
        }
      });
      console.log("[AI Chat] Response received", { hasText: !!response.text, hasFunctionCalls: !!response.functionCalls });
      res.json({
        text: response.text,
        functionCalls: response.functionCalls
      });
    } catch (err) {
      console.error("AI Chat Error:", err);
      res.status(500).json({ error: err.message || "Failed to process chat with AI" });
    }
  });
  app.post("/api/send-confirmation-email", async (req, res) => {
    const { customerEmail, customerName, carName, startDate, endDate, bookingId } = req.body;
    if (!resend) {
      console.warn("RESEND_API_KEY is not set. Email not sent.");
      return res.status(500).json({ error: "Email service not configured" });
    }
    try {
      const { data, error } = await resend.emails.send({
        from: "TNG Drive <onboarding@resend.dev>",
        // Resend test sender
        to: [customerEmail],
        subject: `\u062A\u0623\u0643\u064A\u062F \u062D\u062C\u0632\u0643 - # ${bookingId.slice(0, 8)}`,
        html: `
          <div style="font-family: sans-serif; direction: rtl; text-align: right; background-color: #f4f4f4; padding: 40px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; border-top: 4px solid #C5A059;">
              <h1 style="color: #C5A059;">\u062A\u0645 \u062A\u0623\u0643\u064A\u062F \u062D\u062C\u0632\u0643 \u0628\u0646\u062C\u0627\u062D!</h1>
              <p>\u0639\u0632\u064A\u0632\u064A <strong>${customerName}</strong>\u060C</p>
              <p>\u0646\u062D\u0646 \u0633\u0639\u062F\u0627\u0621 \u0628\u0625\u0628\u0644\u0627\u063A\u0643 \u0623\u0646 \u0637\u0644\u0628 \u062D\u062C\u0632\u0643 \u0642\u062F \u062A\u0645 \u062A\u0623\u0643\u064A\u062F\u0647 \u0628\u0646\u062C\u0627\u062D.</p>
              
              <div style="background-color: #fafafa; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <h3 style="margin-top: 0;">\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u062D\u062C\u0632:</h3>
                <ul style="list-style: none; padding: 0;">
                  <li><strong>\u0627\u0644\u0633\u064A\u0627\u0631\u0629:</strong> ${carName}</li>
                  <li><strong>\u0645\u0646 \u062A\u0627\u0631\u064A\u062E:</strong> ${startDate}</li>
                  <li><strong>\u0625\u0644\u0649 \u062A\u0627\u0631\u064A\u062E:</strong> ${endDate}</li>
                  <li><strong>\u0631\u0642\u0645 \u0627\u0644\u062D\u062C\u0632:</strong> ${bookingId}</li>
                </ul>
              </div>
              
              <p>\u0633\u064A\u0642\u0648\u0645 \u0641\u0631\u064A\u0642\u0646\u0627 \u0628\u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0643 \u0642\u0631\u064A\u0628\u0627\u064B \u0644\u062A\u0631\u062A\u064A\u0628 \u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u0633\u064A\u0627\u0631\u0629.</p>
              <p>\u0634\u0643\u0631\u0627\u064B \u0644\u0627\u062E\u062A\u064A\u0627\u0631\u0643 TNG Drive!</p>
              
              <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
              <p style="font-size: 12px; color: #999999; text-align: center;">\u0647\u0630\u0627 \u0627\u0644\u0628\u0631\u064A\u062F \u0645\u0631\u0633\u0644 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B\u060C \u064A\u0631\u062C\u0649 \u0639\u062F\u0645 \u0627\u0644\u0631\u062F \u0639\u0644\u064A\u0647.</p>
            </div>
          </div>
        `
      });
      if (error) {
        return res.status(400).json({ error });
      }
      res.status(200).json({ data });
    } catch (err) {
      console.error("Error sending email:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.post("/api/notify-admin", async (req, res) => {
    const { customerName, customerPhone, customerEmail, carName, startDate, endDate, totalPrice } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL || "tangierdrive40@gmail.com";
    if (!resend) {
      console.warn("RESEND_API_KEY is not set. Admin email not sent.");
      return res.status(500).json({ error: "Email service not configured" });
    }
    try {
      await resend.emails.send({
        from: "TNG Drive <onboarding@resend.dev>",
        to: [adminEmail],
        subject: `\u062D\u062C\u0632 \u062C\u062F\u064A\u062F \u0645\u0646 ${customerName}`,
        html: `
          <div style="font-family: sans-serif; direction: rtl; text-align: right; padding: 20px;">
            <h2>\u062D\u062C\u0632 \u062C\u062F\u064A\u062F \u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645\u0647!</h2>
            <p><strong>\u0627\u0644\u0639\u0645\u064A\u0644:</strong> ${customerName}</p>
            <p><strong>\u0627\u0644\u0647\u0627\u062A\u0641:</strong> ${customerPhone}</p>
            <p><strong>\u0627\u0644\u0625\u064A\u0645\u064A\u0644:</strong> ${customerEmail}</p>
            <hr>
            <p><strong>\u0627\u0644\u0633\u064A\u0627\u0631\u0629:</strong> ${carName}</p>
            <p><strong>\u0627\u0644\u0641\u062A\u0631\u0629:</strong> \u0645\u0646 ${startDate} \u0625\u0644\u0649 ${endDate}</p>
            <p><strong>\u0627\u0644\u0645\u0628\u0644\u063A \u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A:</strong> ${totalPrice} \u062F\u0631\u0647\u0645</p>
          </div>
        `
      });
      res.status(200).json({ success: true });
    } catch (err) {
      console.error("Error notifying admin:", err);
      res.status(500).json({ error: "Failed to notify admin" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
