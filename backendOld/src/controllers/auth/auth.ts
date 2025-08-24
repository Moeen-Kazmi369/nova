import { Request, Response } from "express";
import crypto from "crypto";
import User from "../../models/User.js";
import sendEmail from "../../utils/sendEmail.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const token = crypto.randomBytes(20).toString("hex");

    user.resetToken = token;
    user.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    const resetURL = `http://localhost:5173/reset-password/${token}`;
    await sendEmail(user.email, "Password Reset", `Reset your password here: ${resetURL}`);

    res.json({ msg: "Password reset link sent" });
  } catch (err) {
    console.log("error from forgot password", err);
    res.status(500).json({ error: "Failed to send reset email" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: "7d" });
    res.json({ msg: "Login successful", token, user });
  } catch (err) {
    res.status(500).json({ error: "Login failed" }); 
  }
};

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashedPassword });

    // Generate JWT token for the new user
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: "7d" });

    res.status(201).json({ msg: "User registered successfully", token, user });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
};

// controllers/authController.ts
export const resetPassword = async (req: Request, res: Response) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }, 
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

