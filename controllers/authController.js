import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/db.js"; // Prisma instance

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

    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};