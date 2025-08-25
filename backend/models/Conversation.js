const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ["user", "ai"], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  attachments: [
    {
      url: String,
      filename: String,
      mimetype: String,
      size: Number,
    },
  ],
});

const conversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  conversationName: { type: String, required: true },
  aiModelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AIModel",
    required: true,
  },
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});

module.exports = mongoose.model("Conversation", conversationSchema);
