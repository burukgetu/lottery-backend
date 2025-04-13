import express from "express";
import bot from "../bot/bot.js";

const router = express.Router();

router.post("/", (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

export default router;  