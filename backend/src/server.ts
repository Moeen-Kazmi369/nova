import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import cors from "cors";
import chatRoutes from "./routes/chat.routes.js";
import modelConfigsRoutes from "./routes/modelConfigsRoutes.js";
import { VercelRequest, VercelResponse } from "@vercel/node";

dotenv.config();

const app = express();

// Middleware
// CORS: allow multiple frontend origins
const allowedOrigins = [
  "https://nova-rouge-eight.vercel.app",
  "http://localhost:5174",
  "http://localhost:5173",
  "https://nova-ai-frontend-nu.vercel.app",
  "https://nova-ai-frontend-iws2.vercel.app",
  "https://nova-vz9w.vercel.app",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json());

// Routes
app.get("/", (_req, res) => {
  res.send("✅ API is working...");
});

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/model-configs", modelConfigsRoutes);

// Initialize DB once per cold start
let dbInitialized = false;

async function ensureDBConnected() {
  if (!dbInitialized) {
    await connectDB();
    console.log("✅ MongoDB Connected");
    dbInitialized = true;
  }
}

// Export a handler for Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureDBConnected();
  console.log("✅ Request received");
  app(req, res); 
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const PORT = process.env.PORT || 5000;
  ensureDBConnected().then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  });
}

