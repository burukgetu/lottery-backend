import express from "express";
import { storeTelegramUser, getTelegramUser } from "../controllers/telegramUserController.js";

const router = express.Router();

router.post("/store-telegram-user", storeTelegramUser);
router.get("/get-telegram-user/:telegramId", getTelegramUser)

export default router;
