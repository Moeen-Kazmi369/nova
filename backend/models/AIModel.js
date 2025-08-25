const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  filename: String,
  mimetype: String,
  size: Number,
  textContent: String, // extracted plain text from the file
});

const aiModelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  ownerAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  apiConfig: Object,
  files: [fileSchema], // up to 3 text files with extracted text content
  fullTextContent: String, // concatenated text from all files (optional)
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});

module.exports = mongoose.model("AIModel", aiModelSchema);
