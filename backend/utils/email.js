const transporter = require("../config/nodemailer");

const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is ${otp}. It expires in 10 minutes.`,
  };

  await transporter.sendMail(mailOptions);
};

const sendResetPasswordEmail = async (email, token) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset Request",
    text: `Click this link to reset your password: ${process.env.CLIENT_URL}/reset-password/${token}`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail, sendResetPasswordEmail };
