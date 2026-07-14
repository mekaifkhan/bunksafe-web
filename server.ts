import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  
  // Basic middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  let onlineUsers = 0;
  let syncedUserCount = Math.floor(Math.random() * (1000 - 100 + 1)) + 100;

  // Update synced count every 30 seconds to keep it "live" but consistent
  setInterval(() => {
    // Small fluctuations to make it look real
    const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
    syncedUserCount = Math.min(1000, Math.max(100, syncedUserCount + change));
    broadcastUserCount();
  }, 30000);

  wss.on("connection", (ws: WebSocket) => {
    onlineUsers++;
    // Send current synced count immediately on connection
    ws.send(JSON.stringify({ type: "USER_COUNT", count: syncedUserCount }));

    ws.on("close", () => {
      onlineUsers--;
    });
  });

  function broadcastUserCount() {
    const data = JSON.stringify({ type: "USER_COUNT", count: syncedUserCount });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", version: "1.0.2", timestamp: new Date().toISOString() });
  });

  const handleSendEmail = async (req: express.Request, res: express.Response) => {
    const { email, pdfBase64, monthName, userName } = req.body;

    console.log(`Attempting to send report to: ${email}`);

    if (!email || !pdfBase64) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields", 
        details: { email: !!email, pdf: !!pdfBase64 } 
      });
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS?.replace(/\s+/g, '');

    if (smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          service: process.env.SMTP_SERVICE || 'gmail',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const mailOptions = {
          from: `"BunkSafe" <${smtpUser}>`,
          to: email,
          subject: `BunkSafe Attendance Report - ${monthName || 'Current Month'}`,
          text: `Hi ${userName || 'User'},\n\nPlease find attached your attendance report.\n\nStay safe and keep tracking!\n\nBest regards,\nBunkSafe Team`,
          attachments: [
            {
              filename: `Attendance_Report_${(monthName || 'Report').replace(/\s+/g, '_')}.pdf`,
              content: pdfBase64.includes("base64,") ? pdfBase64.split("base64,")[1] : pdfBase64,
              encoding: 'base64'
            }
          ]
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${email}`);
        return res.json({ success: true, message: "Report sent successfully" });
      } catch (error: any) {
        console.error("Error sending report email:", error);
        return res.status(500).json({ 
          success: false, 
          error: "Failed to send email", 
          message: error.message 
        });
      }
    } else {
      console.error("SMTP credentials missing in environment variables");
      return res.status(503).json({ 
        success: false, 
        error: "Email service not configured", 
        message: "Please set SMTP_USER and SMTP_PASS in environment variables." 
      });
    }
  };

  app.post("/api/send-email", handleSendEmail);
  app.post("/api/v1/send-report", handleSendEmail);

  // BAA (BunkSafe AI Assistant) Chat endpoint
  app.post("/api/baa/chat", async (req, res) => {
    try {
      const { messages, prompt, pdfBase64, questionType } = req.body;

      if (!prompt) {
        return res.status(400).json({ success: false, error: "Prompt is required" });
      }

      const ai = getGeminiClient();

      const systemInstruction = 
        "You are BAA (BunkSafe AI Assistant), a premium study companion integrated within BunkSafe, a student attendance and tracking app. " +
        "You are a brilliant, empathetic, and professional tutor specializing in engineering, mathematics, coding, academic assignments, exams, and career guidance. " +
        "Under no circumstances should you ever mention Gemini, Google, or your underlying AI engine. If asked about your identity or what model you are, you must answer that you are BAA, BunkSafe's custom-developed premium study AI assistant. " +
        "Always format your responses beautifully using rich Markdown, bullet points, numbered lists, tables, and code blocks as appropriate. " +
        "Be extremely direct, clear, and comprehensive. Speak like an inspiring, highly knowledgeable mentor.";

      // Construct content parts
      const parts: any[] = [];

      // If PDF base64 is present, append it as a part
      if (pdfBase64) {
        parts.push({
          inlineData: {
            mimeType: "application/pdf",
            data: pdfBase64
          }
        });
        
        // Enhance prompt based on PDF questionType
        let prefix = "";
        if (questionType === "solve") {
          prefix = "Please solve the questions in this attached PDF document step-by-step with clear, correct calculations and logic.\n\nQuery: ";
        } else if (questionType === "explain") {
          prefix = "Please explain the key concepts, topics, and ideas described in this attached PDF document in detail.\n\nQuery: ";
        } else if (questionType === "extract") {
          prefix = "Please extract all key formulas, definitions, summaries, and main takeaways from this attached PDF document.\n\nQuery: ";
        }
        parts.push({ text: prefix + prompt });
      } else {
        parts.push({ text: prompt });
      }

      let finalContents: any;
      if (messages && messages.length > 1) {
        // Construct the parts representing full history for context
        const conversationParts: any[] = [];
        
        // Add last 6 messages for context
        const historySlice = messages.slice(-6, -1);
        for (const msg of historySlice) {
          conversationParts.push(`${msg.role === 'user' ? 'Student' : 'BAA'}: ${msg.content}`);
        }
        
        const historyText = conversationParts.join("\n\n");
        const finalPrompt = `Below is the recent history of our conversation:\n\n${historyText}\n\nStudent's latest instruction:\n${prompt}`;
        
        if (pdfBase64) {
          finalContents = {
            parts: [
              {
                inlineData: {
                  mimeType: "application/pdf",
                  data: pdfBase64
                }
              },
              { text: `Syllabus/material is attached. ${finalPrompt}` }
            ]
          };
        } else {
          finalContents = finalPrompt;
        }
      } else {
        if (pdfBase64) {
          finalContents = { parts };
        } else {
          finalContents = prompt;
        }
      }

      // Ensure contents is robustly shaped for @google/genai
      const contentsPayload = (typeof finalContents === "object" && finalContents !== null && "parts" in finalContents)
        ? { role: "user", parts: finalContents.parts }
        : finalContents;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contentsPayload,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const responseText = response.text || "I was unable to calculate a response. Please rephrase your question.";
      return res.json({ success: true, text: responseText });

    } catch (error: any) {
      console.error("BAA Error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to fetch response from BAA server", 
        message: error.message 
      });
    }
  });



  // Catch-all for unhandled API routes
  app.all("/api/*", (req, res) => {
    res.status(404).json({ 
      success: false, 
      error: "API Route Not Found", 
      message: `The endpoint ${req.method} ${req.originalUrl} does not exist.` 
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`SMTP Configured: ${!!process.env.SMTP_USER && !!process.env.SMTP_PASS}`);
    if (process.env.SMTP_USER) console.log(`SMTP User: ${process.env.SMTP_USER}`);
  });
}

startServer();
