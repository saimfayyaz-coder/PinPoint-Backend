import express from "express";

import {
  signup,
  login,
  refreshAccessToken,
  logout,
  getCurrentUser,
} from "../controllers/auth.controller.js";

import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);

router.post("/login", login);

router.post("/refresh-token", refreshAccessToken);

router.post("/logout", logout);

router.get("/me", protect, getCurrentUser);

export default router;
