const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const { elevenLabsLLM } = require("./controllers/userController");
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
// ElevenLabs Custom LLM endpoint (OpenAI-compatible)
app.post("/v1/chat/completions", elevenLabsLLM);
app.get("/", (req, res) => {
  res.send("NOVA 1000 Backend is running");
});

module.exports = app;
