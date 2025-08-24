import { Router } from "express";
import {
  getModelConfigsByAdmin,
  saveAndUpdate,
} from "../controllers/modelConfigsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// POST /api/model-configs/save
router.post("/save", saveAndUpdate);

// POST /api/model-configs/admin-get
router.post("/admin-get", getModelConfigsByAdmin);
export default router;
