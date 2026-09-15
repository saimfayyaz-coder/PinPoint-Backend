import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../services/token.service.js";

import ApiResponse from "../utils/ApiResponse.js";

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Collect field-specific errors
    const errors = {};

    if (!name || !name.trim()) {
      errors.name = ["Name is required"];
    } else if (name.trim().length < 2) {
      errors.name = ["Name must be at least 2 characters"];
    }

    if (!email || !email.trim()) {
      errors.email = ["Email is required"];
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = ["Please enter a valid email address"];
    }

    if (!password) {
      errors.password = ["Password is required"];
    } else if (password.length < 8) {
      errors.password = ["Password must be at least 8 characters"];
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      errors.password = [
        "Password must contain uppercase, lowercase, and number",
      ];
    }

    // If there are validation errors, return them
    if (Object.keys(errors).length > 0) {
      return res
        .status(400)
        .json(new ApiResponse(false, "Validation failed", null, errors));
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json(
        new ApiResponse(false, "User already exists", null, {
          email: ["An account with this email already exists"],
        }),
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    return res.status(201).json(
      new ApiResponse(true, "Signup successful", {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        accessToken,
        refreshToken,
      }),
    );
  } catch (error) {
    console.error("Signup error:", error);
    return res
      .status(500)
      .json(new ApiResponse(false, "Internal server error"));
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const errors = {};

    if (!email || !email.trim()) {
      errors.email = ["Email is required"];
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = ["Please enter a valid email address"];
    }

    if (!password) {
      errors.password = ["Password is required"];
    }

    // If there are validation errors, return them
    if (Object.keys(errors).length > 0) {
      return res
        .status(400)
        .json(new ApiResponse(false, "Validation failed", null, errors));
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return res.status(400).json(
        new ApiResponse(false, "Invalid credentials", null, {
          email: ["No account found with this email"],
        }),
      );
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).json(
        new ApiResponse(false, "Invalid credentials", null, {
          password: ["Incorrect password"],
        }),
      );
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    return res.status(200).json(
      new ApiResponse(true, "Login successful", {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        accessToken,
        refreshToken,
      }),
    );
  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(false, "Internal server error"));
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res
        .status(401)
        .json(new ApiResponse(false, "Refresh token is required"));
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId).select("+refreshToken");

    if (!user || user.refreshToken !== refreshToken) {
      return res
        .status(401)
        .json(new ApiResponse(false, "Invalid refresh token"));
    }

    const accessToken = generateAccessToken(user._id);

    return res.status(200).json(
      new ApiResponse(true, "Access token refreshed successfully", {
        accessToken,
      }),
    );
  } catch (error) {
    return res
      .status(401)
      .json(new ApiResponse(false, "Refresh token expired or invalid"));
  }
};

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      const decoded = jwt.decode(refreshToken);

      if (decoded?.userId) {
        const user = await User.findById(decoded.userId).select(
          "+refreshToken",
        );

        if (user && user.refreshToken === refreshToken) {
          user.refreshToken = null;
          await user.save();
        }
      }
    }

    return res.status(200).json(new ApiResponse(true, "Logout successful"));
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json(new ApiResponse(false, "Logout failed"));
  }
};

export const getCurrentUser = async (req, res) => {
  return res.status(200).json(
    new ApiResponse(true, "Current user fetched successfully", {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
    }),
  );
};

export const registerDeviceToken = async (req, res) => {
  try {
    const { token } = req.body;
    console.log("TOKEN RECEIVED", token);

    if (!token) {
      return res
        .status(400)
        .json(new ApiResponse(false, "Device token is required"));
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json(new ApiResponse(false, "User not found"));
    }

    user.deviceToken = token;
    await user.save();

    return res
      .status(200)
      .json(new ApiResponse(true, "Device token registered successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(false, "Failed to register device token"));
  }
};
