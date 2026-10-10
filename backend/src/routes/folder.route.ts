import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  toggleFolderMember,
} from "../controllers/folder.controller.js";

const router = express.Router();

router.get("/", protectRoute, getFolders);
router.post("/", protectRoute, createFolder);
router.patch("/:id", protectRoute, updateFolder);
router.delete("/:id", protectRoute, deleteFolder);
router.put("/:id/members", protectRoute, toggleFolderMember);

export default router;
