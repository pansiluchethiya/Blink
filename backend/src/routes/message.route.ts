import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
  searchUsers,
  markMessagesAsRead,
  addReaction,
  removeReaction,
  editMessage,
  deleteMessage,
  togglePinMessage,
  getPinnedMessages,
  searchMessages,
  getSharedMedia,
  forwardMessage,
  updateUserStatus,
  getUserStatus,
  setChatDisappearing,
  getLockedChats,
  lockChat,
  unlockChat,
  markViewOnceOpened,
  toggleArchiveChat,
  togglePinChat,
  toggleMuteChat,
  clearChatHistory,
  updateTheme,
  setChatBackground,
  exportChat,
  getLinkPreview,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/search", protectRoute, searchUsers);
router.get("/link-preview", protectRoute, getLinkPreview);
router.patch("/:userId/read", protectRoute, markMessagesAsRead);

router.post("/send/:id", protectRoute, sendMessage);
router.post("/reaction/:messageId/add", protectRoute, addReaction);
router.post("/reaction/:messageId/remove", protectRoute, removeReaction);
router.patch("/edit/:messageId", protectRoute, editMessage);
router.delete("/clear/:userId", protectRoute, clearChatHistory);
router.delete("/:messageId", protectRoute, deleteMessage);
router.patch("/pin/message/:messageId", protectRoute, togglePinMessage);
router.get("/pinned/:userId", protectRoute, getPinnedMessages);
router.get("/search/:userId", protectRoute, searchMessages);
router.get("/media/:userId", protectRoute, getSharedMedia);
router.post("/forward/:messageId", protectRoute, forwardMessage);

router.post("/status/update", protectRoute, updateUserStatus);
router.get("/status/:userId", protectRoute, getUserStatus);

router.patch("/settings/disappearing/:userId", protectRoute, setChatDisappearing);
router.get("/locked", protectRoute, getLockedChats);
router.patch("/lock/:userId", protectRoute, lockChat);
router.post("/unlock/:userId", protectRoute, unlockChat);
router.patch("/view-once/:messageId/open", protectRoute, markViewOnceOpened);

router.patch("/archive/:userId", protectRoute, toggleArchiveChat);
router.patch("/pin/:userId", protectRoute, togglePinChat);
router.patch("/mute/:userId", protectRoute, toggleMuteChat);

router.get("/export/:userId", protectRoute, exportChat);

router.patch("/theme/update", protectRoute, updateTheme);
router.post("/background", protectRoute, setChatBackground);

router.get("/:id", protectRoute, getMessages);

export default router;
