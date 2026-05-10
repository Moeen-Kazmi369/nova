const mongoose = require("mongoose");

const taskDraftSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
  },
  status: {
    type: String,
    enum: ["draft", "approved", "converted_to_envelope"],
    default: "draft",
  },
  content: {
    title: String,
    objective: String,
    audience: String,
    deliverable_type: String,
    output_format: String,
    key_topics: [String],
    constraints: [String],
    proposed_roles: [String],
    priority: { type: String, default: "normal" },
  },
  attachments: [{
    filename: String,
    mimetype: String,
    size: Number,
    url: String, // Link to stored file
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

taskDraftSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("TaskDraft", taskDraftSchema);
