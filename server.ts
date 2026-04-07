import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
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
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

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
  });
}

startServer();
