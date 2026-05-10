const mongoose = require("mongoose");

const novaAceProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  name: { type: String, default: "Default NOVA ACE Profile" },
  instructions: {
    type: String,
    default: "Act as a high-clarity enterprise task composition assistant. Your goal is to refine user intent into a high-quality TaskDraft.",
  },
  knowledgeBindings: [{
    type: String, // References to Supabase document IDs or collection names
  }],
  voiceConfig: {
    provider: { type: String, default: "ElevenLabs" },
    model: { type: String, default: "eleven_multilingual_v2" },
    voiceId: { type: String, default: "alloy" },
    settings: {
      stability: { type: Number, default: 0.5 },
      similarity_boost: { type: Number, default: 0.75 },
    },
  },
  taskCompositionPolicy: {
    requireObjective: { type: Boolean, default: true },
    requireAudience: { type: Boolean, default: true },
    allowAutoDraft: { type: Boolean, default: true },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

novaAceProfileSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("NovaAceProfile", novaAceProfileSchema);
