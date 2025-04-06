import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import { handleStart, handleContact, handlePhoto } from "./handlers.js";

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL || "";

const bot = new TelegramBot(BOT_TOKEN, WEBHOOK_URL ? { webHook: true } : { polling: true });

if (WEBHOOK_URL) {
  bot.setWebHook(`${WEBHOOK_URL}/bot`);
  console.log("🚀 Bot running with Webhook");
} else {
  console.log("🤖 Bot running with Polling");
}

bot.onText(/\/start/, (msg) => handleStart(bot, msg));
bot.on("contact", (msg) => handleContact(bot, msg));
bot.on("photo", (msg) => handlePhoto(bot, msg));

export default bot;