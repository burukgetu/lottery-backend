import prisma from "../config/db.js"; // Prisma instance
import bcrypt from "bcryptjs";
import dayjs from 'dayjs';
import jwt from "jsonwebtoken";
import twilioClient from '../utils/twilioClient.js';

// ✅ Request otp
export const requestOtp = async (req, res) => {
  try {
    const { phone, firstName, lastName, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) return res.status(400).json({ message: 'Phone already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const existingRequest = await prisma.otpRequest.findUnique({ where: { phone } });

    if (existingRequest) {
      await prisma.otpRequest.update({
        where: { phone },
        data: { firstName, lastName, password: hashedPassword, otp, otpExpiresAt },
      });
    } else {
      await prisma.otpRequest.create({
        data: { phone, firstName, lastName, password: hashedPassword, otp, otpExpiresAt },
      });
    }

    await twilioClient.messages.create({
      body: `Your OTP is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone.startsWith('+') ? phone : `+${phone}`
    });

    // await sendSMS(phone, `Your OTP is ${otp}`);
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('Error in /request-otp:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ✅ Verify otp
export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Clean expired OTPs
    await prisma.otpRequest.deleteMany({
      where: {
        otpExpiresAt: { lt: new Date() },
      },
    });

    const request = await prisma.otpRequest.findUnique({ where: { phone } });
    if (!request || request.otp !== otp) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const userExists = await prisma.user.findUnique({ where: { phone } });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const newUser = await prisma.user.create({
      data: {
        phone: request.phone,
        firstName: request.firstName,
        lastName: request.lastName,
        password: request.password,
        isVerified: true,
      },
    });

    await prisma.otpRequest.delete({ where: { phone } });

    // 🔐 Create JWT payload
    const tokenPayload = {
      id: newUser.id,
      name: `${newUser.firstName} ${newUser.lastName}`,
      role: newUser.role,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1d' });

    // 🍪 Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // ✅ Respond with user name and role (safe info only)
    res.status(201).json({
      message: 'User created and verified',
      user: {
        name: `${newUser.firstName} ${newUser.lastName}`,
        role: newUser.role,
      },
    });
    
    // res.status(201).json({ message: 'User created and verified', user: newUser });
  } catch (err) {
    console.error('Error in /verify-otp:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// ✅ Resend otp
export const resendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    const existingRequest = await prisma.otpRequest.findUnique({ where: { phone } });
    if (!existingRequest) return res.status(404).json({ message: 'No request found for this phone' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.otpRequest.update({
      where: { phone },
      data: { otp, otpExpiresAt },
    });

    await twilioClient.messages.create({
      body: `Your new OTP is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone.startsWith('+') ? phone : `+${phone}`
    });

    // await sendSMS(phone, `Your new OTP is: ${otp}`);
    res.status(200).json({ message: 'OTP resent successfully' });
  } catch (err) {
    console.error('Error in /resend-otp:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// ✅ Register a new user
export const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, phone, password } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Phone number already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        phone,
        password: hashedPassword,
      },
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Login user
export const loginUser = async (req, res) => {
  try {
    const { phone, password } = req.body;
    console.log("Logging in ...")
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Set the token as an HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,  // Makes the cookie inaccessible to JavaScript
      secure: process.env.NODE_ENV === "production", // Only set the cookie over HTTPS in production
      maxAge: 7 * 24 * 60 * 60 * 1000,  // Cookie expiration time (7 days)
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",  // Helps mitigate CSRF attacks
    });

    res.json({ message: "Login successful" });

    // res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const logoutUser = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "Strict" : "Lax",
    secure: process.env.NODE_ENV === 'production',
  });
  res.json({ message: 'Logged out successfully' });
}