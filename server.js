import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cron from "node-cron";
import authRoutes from "./routes/authRoutes.js";
import receiptRoutes from "./routes/receiptRoutes.js";
import smsRoutes from "./routes/smsRoutes.js";
import { runDailyDraw } from "./controllers/drawController.js"
import { PrismaClient } from "@prisma/client";

import bot from "./bot/bot.js";
import botRoutes from "./routes/botRoutes.js";
import telegramRoutes from "./routes/telegramRoutes.js";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json()); // JSON parsing

// Routes
app.use("/auth", authRoutes);
app.use("/receipts", receiptRoutes);
app.use("/sms", smsRoutes);

// Telegram routes
app.use("/bot", botRoutes);
app.use("/api", telegramRoutes);

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
// cron.schedule("48 5 * * 6", () => {
//   console.log("Running the weekly draw...");
//   runDailyDraw();
// });

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