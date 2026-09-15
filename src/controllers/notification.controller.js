import Notification from "../models/Notification.js";
import ApiResponse from "../utils/ApiResponse.js";
import { sendTestNotification } from "../utils/testNotification.js";

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id,
    })
      .populate("sender", "name")
      .sort({ createdAt: -1 });

    return res
      .status(200)
      .json(
        new ApiResponse(
          true,
          "Notifications fetched successfully",
          notifications,
        ),
      );
  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(false, "Failed to fetch notifications"));
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        recipient: req.user._id,
      },
      {
        isRead: true,
      },
      {
        new: true,
      },
    );

    if (!notification) {
      return res
        .status(404)
        .json(new ApiResponse(false, "Notification not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(true, "Notification marked as read", notification));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(false, "Failed to mark notification as read"));
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user._id,
        isRead: false,
      },
      {
        isRead: true,
      },
    );

    return res
      .status(200)
      .json(new ApiResponse(true, "All notifications marked as read"));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(false, "Failed to mark notifications as read"));
  }
};

export const sendTestNotificationController = async (req, res) => {
  try {
    const notification = await sendTestNotification();

    return res
      .status(200)
      .json(
        new ApiResponse(
          true,
          "Test notification sent successfully",
          notification,
        ),
      );
  } catch (error) {
    console.error("Test notification failed:", error);

    return res
      .status(500)
      .json(new ApiResponse(false, "Failed to send test notification"));
  }
};
