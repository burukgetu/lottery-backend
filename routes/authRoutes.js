import express from "express";
import { registerUser, loginUser, requestOtp, verifyOtp, resendOtp, logoutUser } from "../controllers/authController.js";

const router = express.Router();

router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

export default router;