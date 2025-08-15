import mongoose, { Document, Schema } from "mongoose";

export interface IModelConfig extends Document {
  modelName: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const modelConfigSchema = new Schema<IModelConfig>(
  {
    modelName: { type: String, required: true },
    temperature: { type: Number, default: 0.7 },
    maxTokens: { type: Number, default: 512 },
    systemPrompt: { type: String }
  },
  { timestamps: true }
);

const ModelConfig = mongoose.model<IModelConfig>("ModelConfig", modelConfigSchema);
export default ModelConfig;
