import express from "express";
import {
  saveMyLocation,
  getMyLocation,
  getAllUsersLocations,
  saveLocation,
  getMySavedLocations,
  deleteSavedLocation,
  getUserSavedLocations,
} from "../controllers/location.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.patch("/me", saveMyLocation);

router.get("/me", getMyLocation);

router.get("/users", getAllUsersLocations);

// ============ SAVED LOCATIONS ============

router.post("/saved", saveLocation);

router.get("/saved", getMySavedLocations);

router.delete("/saved/:locationId", deleteSavedLocation);

router.get("/users/:userId/saved", getUserSavedLocations);

export default router;
