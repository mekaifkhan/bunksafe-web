import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

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

  app.post("/api/notify-setup", async (req, res) => {
    const profile = req.body;
    const { name, email, college, department, semester, mobile } = profile;

    console.log(`New setup notification: ${name} (${email})`);

    // Only attempt to send email if SMTP credentials are provided
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: process.env.SMTP_SERVICE || 'gmail',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const mailOptions = {
          from: process.env.SMTP_USER,
          to: 'megakeliye22@gmail.com',
          subject: `New BunkSafe Setup: ${name}`,
          text: `
            A user has set up BunkSafe!
            
            Details:
            Name: ${name}
            Email: ${email}
            College: ${college}
            Department: ${department}
            Semester: ${semester}
            Mobile: ${mobile}
          `,
        };

        await transporter.sendMail(mailOptions);
        console.log("Notification email sent successfully");
      } catch (error) {
        console.error("Error sending notification email:", error);
      }
    } else {
      console.warn("SMTP credentials not provided. Skipping email notification.");
    }

    res.json({ success: true });
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
