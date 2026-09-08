import Location from "../models/Location.js";
import SavedLocation from "../models/SavedLocation.js";
import ApiResponse from "../utils/ApiResponse.js";

export const saveMyLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.user._id;

    if (!latitude || !longitude) {
      return res
        .status(400)
        .json(new ApiResponse(false, "Latitude and longitude are required"));
    }

    // Find existing location or create new
    const location = await Location.findOneAndUpdate(
      { userId },
      { latitude, longitude },
      { new: true, upsert: true },
    );

    return res.status(200).json(
      new ApiResponse(true, "Location saved successfully", {
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          updatedAt: location.updatedAt,
        },
      }),
    );
  } catch (error) {
    console.error("Save location error:", error);
    return res
      .status(500)
      .json(new ApiResponse(false, "Internal server error"));
  }
};

export const getMyLocation = async (req, res) => {
  try {
    const userId = req.user._id;

    const location = await Location.findOne({ userId });

    if (!location) {
      return res.status(200).json(
        new ApiResponse(true, "Location not set", {
          location: null,
          hasSetLocation: false,
        }),
      );
    }

    return res.status(200).json(
      new ApiResponse(true, "Location fetched successfully", {
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          updatedAt: location.updatedAt,
        },
        hasSetLocation: true,
      }),
    );
  } catch (error) {
    console.error("Get my location error:", error);
    return res
      .status(500)
      .json(new ApiResponse(false, "Internal server error"));
  }
};

export const getAllUsersLocations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const locations = await Location.find({
      userId: { $ne: currentUserId }, // Exclude current user
    }).populate("userId", "name email");

    const usersLocations = locations
      .filter((loc) => loc.userId)
      .map((loc) => ({
        userId: loc.userId._id,
        name: loc.userId.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
        updatedAt: loc.updatedAt,
      }));

    return res.status(200).json(
      new ApiResponse(true, "Users locations fetched successfully", {
        users: usersLocations,
      }),
    );
  } catch (error) {
    console.error("Get users locations error:", error);
    return res
      .status(500)
      .json(new ApiResponse(false, "Internal server error"));
  }
};

// ============ SAVED LOCATIONS PART ============

// Save a new location
export const saveLocation = async (req, res) => {
  try {
    const { name, description, latitude, longitude, category, placeId, isPoi } =
      req.body;
    const userId = req.user._id;
    const errors = {};

    if (!name || !name.trim()) {
      errors.name = ["Name is required"];
    }

    if (!latitude || !longitude) {
      errors.location = ["Latitude and longitude are required"];
    }

    if (Object.keys(errors).length > 0) {
      return res
        .status(400)
        .json(new ApiResponse(false, "Validation failed", null, errors));
    }

    const savedLocation = await SavedLocation.create({
      userId,
      name: name.trim(),
      description: description?.trim() || "",
      latitude,
      longitude,
      category: category || "other",
      placeId: placeId || null,
      isPoi: isPoi || false,
    });

    return res.status(201).json(
      new ApiResponse(true, "Location saved successfully", {
        location: {
          id: savedLocation._id,
          name: savedLocation.name,
          description: savedLocation.description,
          latitude: savedLocation.latitude,
          longitude: savedLocation.longitude,
          category: savedLocation.category,
          placeId: savedLocation.placeId,
          isPoi: savedLocation.isPoi,
          createdAt: savedLocation.createdAt,
        },
      }),
    );
  } catch (error) {
    console.error("Save location error:", error);
    return res
      .status(500)
      .json(new ApiResponse(false, "Internal server error"));
  }
};
// Get my saved locations
export const getMySavedLocations = async (req, res) => {
  try {
    const userId = req.user._id;

    const savedLocations = await SavedLocation.find({ userId }).sort({
      createdAt: -1,
    });

    const locations = savedLocations.map((loc) => ({
      id: loc._id,
      name: loc.name,
      description: loc.description,
      latitude: loc.latitude,
      longitude: loc.longitude,
      category: loc.category,
      createdAt: loc.createdAt,
      formattedDate: formatDate(loc.createdAt),
    }));

    return res.status(200).json(
      new ApiResponse(true, "Saved locations fetched successfully", {
        locations,
      }),
    );
  } catch (error) {
    console.error("Get saved locations error:", error);
    return res
      .status(500)
      .json(new ApiResponse(false, "Internal server error"));
  }
};

// Delete a saved location
export const deleteSavedLocation = async (req, res) => {
  try {
    const { locationId } = req.params;
    const userId = req.user._id;

    const location = await SavedLocation.findOneAndDelete({
      _id: locationId,
      userId,
    });

    if (!location) {
      return res.status(404).json(new ApiResponse(false, "Location not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(true, "Location deleted successfully"));
  } catch (error) {
    console.error("Delete location error:", error);
    return res
      .status(500)
      .json(new ApiResponse(false, "Internal server error"));
  }
};

// Get user's saved locations (for other users)
export const getUserSavedLocations = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const totalLocations = await SavedLocation.countDocuments({ userId });

    const savedLocations = await SavedLocation.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const locations = savedLocations.map((loc) => ({
      id: loc._id,
      name: loc.name,
      description: loc.description,
      latitude: loc.latitude,
      longitude: loc.longitude,
      category: loc.category,
      createdAt: loc.createdAt,
      formattedDate: formatDate(loc.createdAt),
    }));

    const hasMore = skip + locations.length < totalLocations;

    return res.status(200).json(
      new ApiResponse(true, "User locations fetched successfully", {
        locations,
        pagination: {
          page,
          limit,
          total: totalLocations,
          hasMore,
        },
      }),
    );
  } catch (error) {
    console.error("Get user locations error:", error);
    return res
      .status(500)
      .json(new ApiResponse(false, "Internal server error"));
  }
};
const formatDate = (date) => {
  const now = new Date();
  const saved = new Date(date);
  const diffMs = now - saved;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};
