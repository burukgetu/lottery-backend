import express from "express";
import { receiveSMS } from "../controllers/smsController.js"

const router = express.Router();

router.post("/receive", receiveSMS);

export default router;