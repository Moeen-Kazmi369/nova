const mongoose = require("mongoose");

const aiModelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  ownerAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  ragTableName: String, // Supabase vector DB table storing embeddings
  vectorDimension: Number,
  apiConfig: Object, // OpenAI or other AI API configs
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});

module.exports = mongoose.model("AIModel", aiModelSchema);
