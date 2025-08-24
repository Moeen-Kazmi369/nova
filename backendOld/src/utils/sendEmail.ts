import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER!,
    pass: process.env.GMAIL_PASS!,
  },
});

const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      html,
    });
    console.log("✅ Email sent to", to);
  } catch (err) {
    console.error("❌ Email sending error:", err);
    throw err;
  }
};

export default sendEmail;
