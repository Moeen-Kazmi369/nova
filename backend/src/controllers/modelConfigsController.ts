import { Request, Response } from "express";
import ModelConfig, { IModelConfig } from "../models/modelConfigModel.js";

interface IModelConfigRequest extends Request {
  body: Partial<IModelConfig> & { _id?: string };
  user?: { id: string }; // if using auth middleware
}

export const saveAndUpdate = async (req: IModelConfigRequest, res: Response) => {
  try {
    const { _id, ...configData } = req.body;

    let config: IModelConfig | null;

    if (_id) {
      config = await ModelConfig.findByIdAndUpdate(_id, configData, { new: true });
      if (!config) {
        return res.status(404).json({ error: "ModelConfig not found" });
      }
    } else {
      config = await ModelConfig.create(configData);
    }

    res.status(200).json({ message: "ModelConfig saved successfully", config });
  } catch (err) {
    console.error("Error saving ModelConfig:", err);
    res.status(500).json({ error: "Failed to save ModelConfig" });
  }
};
