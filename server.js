import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cron from "node-cron";
import authRoutes from "./routes/authRoutes.js";
import receiptRoutes from "./routes/receiptRoutes.js";
import smsRoutes from "./routes/smsRoutes.js";
import winnerRoutes from "./routes/winnerRoutes.js";
import { runDailyDraw } from "./controllers/drawController.js"
import { PrismaClient } from "@prisma/client";
import { authenticateUser } from './middlewares/authMiddleware.js';
import cookieParser from 'cookie-parser';
import jwt from "jsonwebtoken";
import rateLimit from 'express-rate-limit';

import bot from "./bot/bot.js";
import botRoutes from "./routes/botRoutes.js";
import telegramRoutes from "./routes/telegramRoutes.js";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each IP to 5 requests per 10 minutes
  message: {
    message: "Too many login or registration attempts. Please try again after 10 minutes.",
    retryAfter: 600 // 10 minutes in seconds
  },
  headers: true,  // Include rate limit info in the response headers
});

// Middleware
// const corsOptions = {
//   origin: 'http://localhost:5173', // Allow only the frontend domain
//   methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed methods
//   credentials: true, // Allow credentials (cookies, authorization headers)
// };

// app.use(cors(corsOptions));

app.use(
  cors({
    origin: "http://localhost:5173", // Vite dev server
    credentials: true, // Allow cookies to be sent
  })
);
app.use(cookieParser());
app.use(express.json()); // JSON parsing

// Apply rate limiter to all auth routes
app.use("/auth", authLimiter);

// Routes
app.use("/auth", authRoutes);
app.use("/receipts", receiptRoutes);
app.use("/sms", smsRoutes);
app.use("/winner", winnerRoutes);

// Telegram routes
app.use("/bot", botRoutes);
app.use("/api", telegramRoutes);

app.get('/me', async (req, res) => {
  try {
    console.log("me was requested")
    // console.log(req.cookies);
    
    const token = req.cookies.token;
    console.log({token});
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }


    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, firstName: true, role: true }, // customize what you return
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

//   try {
//   // You now have access to `req.user` (name, role, etc.)
//   console.log("messagae /me", {
//     name: req.user.name,
//     role: req.user.role,
//   })

//   res.json({
//     name: req.user.name,
//     role: req.user.role,
//   });
// } catch(err) {
//   console.log({err})
//   res.status(500).json({ message: 'Internal server error', err });
// }
});


// Root Route
app.get("/", (req, res) => {
    res.send("Lottery API is running...");
  });

// Telegram webhook or polling
const WEBHOOK_URL = process.env.WEBHOOK_URL || "";

// Enable webhook or polling
if (WEBHOOK_URL) {
  bot.setWebHook(`${WEBHOOK_URL}/bot`);
  console.log("🚀 Bot running with Webhook");
} else {
  console.log("🤖 Bot running with Polling");
}

// Schedule the daily draw at midnight (00:00)
cron.schedule("51 18 * * 6", () => {
  console.log("Running the weekly draw...");
  runDailyDraw();
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  // Test database connection
  try {
    await prisma.$connect();
    console.log("✅ Connected to PostgreSQL");
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
  }
});