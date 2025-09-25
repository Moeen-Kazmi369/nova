// backend/server.js
const http = require("http");
const app = require("./app");
const { Server } = require("socket.io");
const connectDB = require("./config/mongodb");
const supabase = require("./config/supabase");
const openaiClient = require("./config/openai");
const transporter = require("./config/nodemailer");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Socket logic for voice will be here later

io.on("connection", (socket) => {
  console.log("Socket connected");
  // Events later
});
// Function to verify all service connections
const verifyConnections = async () => {
  const results = {
    mongodb: false,
    supabase: false,
    openai: false,
    nodemailer: false,
  };

  try {
    // Verify MongoDB
    await connectDB();
    results.mongodb = true;
    console.log("MongoDB: Connection successful");
  } catch (error) {
    console.error("MongoDB: Connection failed -", error.message);
  }

  try {
    // Verify Supabase
    const { data, error } = await supabase.from("documents").select("*").limit(1);
    if (error) throw new Error(error.message);
    results.supabase = true;
    console.log("Supabase: Connection successful");
  } catch (error) {
    console.error("Supabase: Connection failed -", error.message);
  }

  try {
    // Verify OpenAI
    const models = await openaiClient.models.list();
    if (models) {
      results.openai = true;
      console.log("OpenAI: Connection successful");
    } else {
      throw new Error("No response from OpenAI");
    }
  } catch (error) {
    console.error("OpenAI: Connection failed -", error.message);
  }

  try {
    // Verify Nodemailer
    await transporter.verify();
    results.nodemailer = true;
    console.log("Nodemailer: Connection successful");
  } catch (error) {
    console.error("Nodemailer: Connection failed -", error.message);
  }

  return results;
};

// Connect to all services and start server
const startServer = async () => {
  try {
    const connections = await verifyConnections();
    
    // Check if all connections are successful
    const allConnected = Object.values(connections).every(status => status === true);
    
    if (!allConnected) {
      console.error("Some services failed to connect:", connections);
      // process.exit(1);
    }

    // Start the server only if all connections are successful
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log("All services (MongoDB, Supabase, OpenAI, Nodemailer) are connected successfully!");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();