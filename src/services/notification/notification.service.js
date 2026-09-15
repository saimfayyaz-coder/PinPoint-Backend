import "../firebase/firebaseAdmin.js";
import { getMessaging } from "firebase-admin/messaging";

import Notification from "../../models/Notification.js";
import User from "../../models/User.js";

export const createAndSendNotification = async ({
  recipient,
  sender = null,
  type,
  title,
  body,
  data = {},
}) => {
  const notification = await Notification.create({
    recipient,
    sender,
    type,
    title,
    body,
    data,
  });

  const user = await User.findById(recipient);

  if (!user?.deviceToken) {
    return notification;
  }

  try {
    await getMessaging().send({
      token: user.deviceToken,

      notification: {
        title,
        body,
      },

      data: Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, String(value)]),
      ),
    });

    console.log("FCM notification sent successfully");
  } catch (error) {
    console.error("FCM notification failed:", error);
  }

  return notification;
};
