import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import cors from "cors";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

dotenv.config();

let adminApp: any;

// Initialize Firebase Admin
try {
  adminApp = initializeApp({
    credential: applicationDefault(),
    projectId: "bunksafe-by-kaif-khan"
  });
  console.log("Firebase Admin initialized successfully with Application Default Credentials.");
} catch (error) {
  console.warn("Application Default Credentials not found, falling back to project ID only:", error);
  adminApp = initializeApp({
    projectId: "bunksafe-by-kaif-khan"
  });
}

const dbAdmin = getFirestore(adminApp);

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

  // POST endpoint to send multicast push notifications from the Admin Panel
  app.post("/api/send-notification", async (req, res) => {
    const { title, body, tokens } = req.body;
    if (!title || !body || !tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({ success: false, error: "Missing required fields or empty tokens array" });
    }

    try {
      const validTokens = tokens.filter(t => typeof t === 'string' && t.trim().length > 0);
      if (validTokens.length === 0) {
        return res.status(400).json({ success: false, error: "No valid FCM tokens provided" });
      }

      console.log(`FCM Multicast request received for ${validTokens.length} tokens.`);

      const messagePayload = {
        notification: { title, body },
        tokens: validTokens
      };

      const response = await getMessaging(adminApp).sendEachForMulticast(messagePayload);
      console.log(`Successfully sent ${response.successCount} messages; ${response.failureCount} failed.`);
      
      return res.json({ 
        success: true, 
        successCount: response.successCount, 
        failureCount: response.failureCount 
      });
    } catch (error: any) {
      console.error("Error sending FCM notification:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  });

  // Background attendance reminder check
  async function checkAndSendAttendanceReminders() {
    console.log(`${new Date().toISOString()} - Running scheduled attendance reminder check...`);
    try {
      const usersSnap = await dbAdmin.collection("users").get();
      const now = new Date();
      let sentCount = 0;

      for (const doc of usersSnap.docs) {
        const userData = doc.data();
        const profile = userData.profile || {};
        
        const fcmToken = userData.fcmToken || profile.fcmToken;
        const timezone = userData.timezone || profile.timezone || "Asia/Kolkata";
        const lastAttendanceMarkedDate = userData.lastAttendanceMarkedDate || profile.lastAttendanceMarkedDate || "";
        const lastReminderSentDate = userData.lastReminderSentDate || profile.lastReminderSentDate || "";

        if (!fcmToken) {
          continue; // skip if no token
        }

        try {
          // Format current time into user's timezone using Intl
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            hour12: false
          });
          const parts = formatter.formatToParts(now);
          const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));
          
          const localHour = parseInt(partMap.hour, 10);
          const localDateStr = `${partMap.year}-${partMap.month}-${partMap.day}`; // YYYY-MM-DD

          // Check if local hour is 20 (8:00 PM)
          if (localHour === 20) {
            // Check if attendance is already marked for today
            if (lastAttendanceMarkedDate === localDateStr) {
              console.log(`User ${doc.id} already marked attendance for today (${localDateStr}). Skipping.`);
              continue;
            }

            // Check if reminder was already sent today
            if (lastReminderSentDate === localDateStr) {
              continue; // skip to avoid duplicates
            }

            // Send FCM notification
            const payload = {
              notification: {
                title: "⚠️ Attendance Reminder",
                body: "You haven't marked today's attendance yet. Open BunkSafe before the day ends."
              },
              token: fcmToken
            };

            await getMessaging(adminApp).send(payload);
            console.log(`Sent attendance reminder to user: ${doc.id}`);
            sentCount++;

            // Update lastReminderSentDate in Firestore to avoid duplicate sends
            await doc.ref.set({
              lastReminderSentDate: localDateStr
            }, { merge: true });
          }
        } catch (userErr: any) {
          console.error(`Error processing reminder for user ${doc.id}:`, userErr.message);
        }
      }
      console.log(`Finished scheduled attendance reminder check. Sent ${sentCount} reminders.`);
      return sentCount;
    } catch (err: any) {
      console.error("Error in checkAndSendAttendanceReminders:", err);
      return 0;
    }
  }

  // Set Interval to check every 15 minutes
  setInterval(checkAndSendAttendanceReminders, 15 * 60 * 1000);

  // Endpoint to manually run the daily reminder scheduler check immediately (useful for testing)
  app.post("/api/trigger-scheduler", async (req, res) => {
    try {
      console.log("Manual trigger for scheduler received.");
      const count = await checkAndSendAttendanceReminders();
      return res.json({ success: true, message: "Scheduler run complete.", sentCount: count });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
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
