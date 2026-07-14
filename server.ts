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
import admin from "firebase-admin";

dotenv.config();

const serverStartTime = Date.now();

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

// ----------------------------------------------------
// Cost-Efficient Notification System (8 PM Asia/Kolkata)
// ----------------------------------------------------
const holidays2026: Record<string, string> = {
  '2026-01-26': 'Republic Day',
  '2026-02-15': 'Maha Shivratri',
  '2026-03-03': 'Holi',
  '2026-03-04': 'Holi',
  '2026-03-20': 'Jumatul Wida*',
  '2026-03-21': 'Eidul Fitr*',
  '2026-03-22': 'Eidul Fitr*',
  '2026-03-26': 'Ram Navmi',
  '2026-03-31': 'Mahavir Jayanti',
  '2026-04-03': 'Good Friday',
  '2026-05-01': 'Buddha Purnima',
  '2026-05-27': 'Eidul-Azha*',
  '2026-05-28': 'Eidul-Azha*',
  '2026-06-25': 'Muharram*',
  '2026-06-26': 'Muharram*',
  '2026-08-05': 'Chehellum*',
  '2026-08-15': 'Independence day',
  '2026-08-26': 'Eid- Milad-Un-Nabi*',
  '2026-09-04': 'Janamashtami',
  '2026-10-02': 'Gandhi Jayanti',
  '2026-10-19': 'Dussehra',
  '2026-10-20': 'Dussehra',
  '2026-11-07': 'Diwali (Deepavali)',
  '2026-11-08': 'Diwali (Deepavali)',
  '2026-11-24': 'Guru Nanak Jayanti',
  '2026-12-25': 'Christmas Day',
};

function getKolkataTime() {
  const now = new Date();
  
  const dateStr = new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now); // "YYYY-MM-DD"
  
  const timeStr = now.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: 'numeric',
    minute: 'numeric'
  }); // "HH:MM"
  
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  const dayOfWeekStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long'
  }).format(now); // "Monday", "Tuesday", etc.
  
  return {
    dateStr,
    hours,
    minutes,
    dayOfWeekStr
  };
}

let adminApp: any = null;
let adminDb: any = null;
let adminMessaging: any = null;

function getFirebaseAdmin() {
  if (!adminApp) {
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountVar) {
      return null;
    }
    try {
      let serviceAccount;
      if (serviceAccountVar.trim().startsWith('{')) {
        serviceAccount = JSON.parse(serviceAccountVar);
      } else {
        serviceAccount = serviceAccountVar;
      }
      adminApp = (admin as any).initializeApp({
        credential: (admin as any).credential.cert(serviceAccount)
      });
      adminDb = adminApp.firestore();
      adminMessaging = adminApp.messaging();
      console.log("Successfully initialized Firebase Admin SDK");
    } catch (e: any) {
      console.error("Error initializing Firebase Admin SDK:", e.message);
      return null;
    }
  }
  return { db: adminDb!, messaging: adminMessaging! };
}

let lastNotificationRunDate = "";

async function checkAndSend8PMNotifications(force: boolean = false): Promise<any> {
  const adminSdk = getFirebaseAdmin();
  if (!adminSdk) {
    return { success: false, error: "Firebase Admin SDK not initialized. Set FIREBASE_SERVICE_ACCOUNT." };
  }

  const { db, messaging } = adminSdk;
  const kolkata = getKolkataTime();
  
  console.log(`[Notification Scheduler] Starting checks for date: ${kolkata.dateStr}, Day: ${kolkata.dayOfWeekStr}, Force: ${force}`);
  
  // Prevent duplicate execution on the same day unless forced
  if (!force && lastNotificationRunDate === kolkata.dateStr) {
    const msg = `Skipping: Already executed today (${kolkata.dateStr})`;
    console.log(`[Notification Scheduler] ${msg}`);
    return { success: true, skipped: true, reason: msg };
  }
  
  // Skip notification if Saturday or Sunday unless forced
  if (!force && (kolkata.dayOfWeekStr === "Saturday" || kolkata.dayOfWeekStr === "Sunday")) {
    const msg = `Skipping notifications (Weekend: ${kolkata.dayOfWeekStr})`;
    console.log(`[Notification Scheduler] ${msg}`);
    return { success: true, skipped: true, reason: msg };
  }
  
  // Skip notification if JMI Holiday unless forced
  const isJmiHoliday = holidays2026[kolkata.dateStr];
  if (!force && isJmiHoliday) {
    const msg = `Skipping notifications (JMI Holiday: ${isJmiHoliday})`;
    console.log(`[Notification Scheduler] ${msg}`);
    return { success: true, skipped: true, reason: msg };
  }
  
  lastNotificationRunDate = kolkata.dateStr;
  
  try {
    const devicesSnapshot = await db.collection('notificationDevices').get();
    
    if (devicesSnapshot.empty) {
      console.log('[Notification Scheduler] No devices found.');
      return { success: true, sentCount: 0, skippedCount: 0, message: "No devices found" };
    }
    
    const sendPromises: Promise<any>[] = [];
    let sentCount = 0;
    let skippedCount = 0;
    
    devicesSnapshot.forEach(doc => {
      const device = doc.data();
      
      const isEnabled = device.notificationEnabled === true;
      const bypassDate = device.lastReminderBypassDate;
      const openedToday = bypassDate === kolkata.dateStr;
      
      // Send notification if enabled AND bypassDate is not today's date
      if (isEnabled && !openedToday) {
        if (!device.fcmToken) {
          console.log(`[Notification Scheduler] Device ${doc.id} matches criteria but has no FCM token. Skipping.`);
          skippedCount++;
          return;
        }
        
        console.log(`[Notification Scheduler] Sending reminder to device ${doc.id}`);
        
        const message = {
          token: device.fcmToken,
          notification: {
            title: '📚 Attendance Reminder',
            body: "You haven't opened BunkSafe this afternoon.\nOpen the app and mark today's attendance before the day ends."
          },
          data: {
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
            type: 'attendance_reminder'
          },
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              clickAction: 'FLUTTER_NOTIFICATION_CLICK'
            }
          }
        };
        
        const p = messaging.send(message)
          .then((response: any) => {
            console.log(`[Notification Scheduler] Successfully sent reminder to device ${doc.id}:`, response);
          })
          .catch(async (error: any) => {
            console.error(`[Notification Scheduler] Error sending message to device ${doc.id}:`, error.message);
            if (
              error.code === 'messaging/invalid-registration-token' ||
              error.code === 'messaging/registration-token-not-registered'
            ) {
              console.log(`[Notification Scheduler] Cleaning up expired token for device ${doc.id}...`);
              try {
                await doc.ref.update({ notificationEnabled: false });
              } catch (updateErr: any) {
                console.error(`[Notification Scheduler] Failed to clean up token for device ${doc.id}:`, updateErr.message);
              }
            }
          });
          
        sendPromises.push(p);
        sentCount++;
      } else {
        skippedCount++;
      }
    });
    
    if (sendPromises.length > 0) {
      await Promise.all(sendPromises);
    }
    console.log(`[Notification Scheduler] Completed sending reminders for ${kolkata.dateStr}. Sent: ${sentCount}, Skipped: ${skippedCount}`);
    return {
      success: true,
      sentCount,
      skippedCount,
      date: kolkata.dateStr,
      day: kolkata.dayOfWeekStr
    };
  } catch (error: any) {
    console.error('[Notification Scheduler] Fatal error during checks:', error);
    return { success: false, error: error.message };
  }
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

  // Helper to trigger test notifications
  async function triggerTestNotification(): Promise<any> {
    const adminSdk = getFirebaseAdmin();
    if (!adminSdk) {
      console.error("[Test Mode] Failed to initialize Firebase Admin SDK. Check FIREBASE_SERVICE_ACCOUNT.");
      return { success: false, error: "Firebase Admin SDK not initialized." };
    }

    const { db, messaging } = adminSdk;

    try {
      // Check persistent test state in Firestore to ensure it runs only once
      const testModeRef = db.collection('systemConfig').doc('testMode');
      const testModeDoc = await testModeRef.get();
      
      if (testModeDoc.exists && testModeDoc.data()?.testNotificationSent === true) {
        console.log("[Test Mode] Test notification already sent previously. Bypassing test mode.");
        return { success: true, message: "Test mode already completed.", testNotificationSent: true };
      }

      console.log("[Cron Endpoint] Cron triggered for testing purposes");

      // Fetch active notification devices
      const devicesSnapshot = await db.collection('notificationDevices').get();
      if (devicesSnapshot.empty) {
        console.log("[Test Mode] No devices found in notificationDevices collection.");
        return { success: true, sentCount: 0, message: "No devices found" };
      }

      const sendPromises: Promise<any>[] = [];
      let sentCount = 0;

      devicesSnapshot.forEach(doc => {
        const device = doc.data();
        if (device.notificationEnabled === true && device.fcmToken) {
          console.log(`[Test Mode] FCM token found for device ${doc.id}: ${device.fcmToken}`);
          
          const message = {
            token: device.fcmToken,
            notification: {
              title: '🧪 BunkSafe Test Notification',
              body: 'Congratulations! Your BunkSafe notification system is working successfully. 🎉'
            },
            data: {
              click_action: 'FLUTTER_NOTIFICATION_CLICK',
              type: 'test_notification'
            },
            android: {
              priority: 'high',
              notification: {
                sound: 'default',
                clickAction: 'FLUTTER_NOTIFICATION_CLICK'
              }
            }
          };

          const p = messaging.send(message)
            .then((response: any) => {
              console.log(`[Test Mode] Notification sent successfully to device ${doc.id}`);
            })
            .catch((error: any) => {
              console.error(`[Test Mode] Error sending notification to device ${doc.id}: ${error.message}`);
            });

          sendPromises.push(p);
          sentCount++;
        }
      });

      if (sendPromises.length > 0) {
        await Promise.all(sendPromises);
      }

      // Mark test as completed in Firestore to disable test mode automatically
      await testModeRef.set({ testNotificationSent: true }, { merge: true });
      console.log("[Test Mode] Test notification sent successfully, test mode automatically disabled.");

      return {
        success: true,
        sentCount,
        message: "Test notifications sent successfully and test mode is now disabled."
      };
    } catch (err: any) {
      console.error("[Test Mode] Exception during test execution:", err.message);
      return { success: false, error: err.message };
    }
  }

  // Scheduled Cron Route for 8 PM Notifications
  app.all("/api/cron/send-reminders", async (req, res) => {
    console.log("[Cron Endpoint] Received request to send reminders");
    
    // Auth Check
    const authHeader = req.headers.authorization;
    const querySecret = req.query.secret;
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret) {
      const expectedBearer = `Bearer ${cronSecret}`;
      if (authHeader !== expectedBearer && querySecret !== cronSecret) {
        console.warn("[Cron Endpoint] Unauthorized attempt to trigger notifications");
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }
    } else {
      console.warn("[Cron Endpoint] Warning: CRON_SECRET is not set in environment variables. Running without authorization check.");
    }
    
    // Determine if we should trigger the test notification
    const isExplicitTest = req.query.test === "true" || (req.body && req.body.test === true);
    const isWithinFiveMinutes = (Date.now() - serverStartTime) < 5 * 60 * 1000;
    
    let isTestActive = isExplicitTest;
    
    if (!isTestActive && isWithinFiveMinutes) {
      // Check Firestore to see if test mode has already run once
      const adminSdk = getFirebaseAdmin();
      if (adminSdk) {
        try {
          const testModeDoc = await adminSdk.db.collection('systemConfig').doc('testMode').get();
          const testNotificationSent = testModeDoc.exists && testModeDoc.data()?.testNotificationSent === true;
          if (!testNotificationSent) {
            console.log("[Cron Endpoint] Active 5-minute post-deployment window detected and test has not been sent yet. Running test mode...");
            isTestActive = true;
          }
        } catch (dbErr: any) {
          console.warn("[Cron Endpoint] Error checking test mode status from Firestore, skipping auto-test:", dbErr.message);
        }
      }
    }
    
    if (isTestActive) {
      const result = await triggerTestNotification();
      return res.json(result);
    }
    
    // Standard Production Route
    const force = req.query.force === "true" || (req.body && req.body.force === true);
    const result = await checkAndSend8PMNotifications(force);
    return res.json(result);
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
