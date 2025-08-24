// backend/server.js
const http = require("http");
const app = require("./app");
const { Server } = require("socket.io");

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

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
