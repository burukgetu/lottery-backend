import express from "express";
import upload from "../utils/upload.js";
import { uploadReceipt, uploadTelegramReceipt } from "../controllers/receiptController.js";
// import mobileImageUpload from "../middlewares/mobileImageUpload.js"
const router = express.Router();

router.post("/upload", upload.single("image"), uploadReceipt);
router.post("/telegram/upload", upload.single("image"), uploadTelegramReceipt);
// router.post("/mobile/upload", mobileImageUpload.single("image"), uploadReceipt);

export default router;