import { createAndSendNotification } from "../services/notification/notification.service.js";

export const sendTestNotification = async () => {
  return createAndSendNotification({
    recipient: "6a96b6223a3e7e8f8ddef84b", // saim2@gmail.com
    sender: "6a97d46be83eef18cb68d461", // Saim Fayyaz

    type: "FRIEND_REQUEST",

    title: "New Friend Request",
    body: "Saim Fayyaz sent you a friend request",

    data: {
      type: "FRIEND_REQUEST",
      requestId: "mock-request-001",
      senderId: "6a97d46be83eef18cb68d461",
    },
  });
};
