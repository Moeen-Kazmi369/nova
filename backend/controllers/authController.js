const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const transporter = require("../config/nodemailer");

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const sendOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"No Reply" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Your email verification OTP",
    text: `Your OTP is ${otp}. It will expire in 15 minutes.`,
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpireAt = Date.now() + 15 * 60 * 1000; // 15 mins

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
      emailVerificationOTP: otp,
      otpExpireAt,
    });

    await user.save();
    await sendOTPEmail(email, otp);

    res
      .status(201)
      .json({ message: "User registered. Verification OTP sent to email." });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "Invalid email" });
    if (user.isVerified)
      return res.status(400).json({ message: "User already verified" });
    if (user.emailVerificationOTP !== otp)
      return res.status(400).json({ message: "Invalid OTP" });
    if (user.otpExpireAt < Date.now())
      return res.status(400).json({ message: "OTP expired" });

    user.isVerified = true;
    user.emailVerificationOTP = undefined;
    user.otpExpireAt = undefined;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    if (!user.isVerified)
      return res.status(400).json({ message: "Email not verified" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, role: user.role, name: user.name, email: user.email,userId:user?._id });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const sendResetPasswordEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  await transporter.sendMail({
    from: `"No Reply" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Password reset request",
    text: `Reset your password using the following link: ${resetUrl}. This link expires in 30 minutes.`,
  });
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "No user with this email" });

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 mins
    await user.save();
    await sendResetPasswordEmail(email, resetToken);

    res.json({ message: "Password reset email sent" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user)
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
