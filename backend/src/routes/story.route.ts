import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  storyUpload,
  createStory,
  getStoryFeed,
  getMyStories,
  getArchivedStories,
  viewStory,
  archiveStory,
  unarchiveStory,
  deleteStory,
} from "../controllers/story.controller.js";

const router = express.Router();

router.get("/feed", protectRoute, getStoryFeed);
router.get("/mine", protectRoute, getMyStories);
router.get("/archived", protectRoute, getArchivedStories);
router.post("/", protectRoute, storyUpload, createStory);
router.post("/:id/view", protectRoute, viewStory);
router.post("/:id/archive", protectRoute, archiveStory);
router.post("/:id/unarchive", protectRoute, unarchiveStory);
router.delete("/:id", protectRoute, deleteStory);

export default router;
