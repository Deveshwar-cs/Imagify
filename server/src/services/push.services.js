import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

export const sendPushNotification = async (subscription, payload) => {
  try {
    const response = await webpush.sendNotification(
      subscription,
      JSON.stringify(payload),
    );

    console.log("Push notification sent successfully");
    console.log("Push service status code:", response.statusCode);

    return {
      success: true,
      statusCode: response.statusCode,
    };
  } catch (error) {
    console.error("Push notification error");
    console.error("Status code:", error.statusCode);
    console.error("Error message:", error.message);
    console.error("Body:", error.body);

    if (error.statusCode === 404 || error.statusCode === 410) {
      return {
        success: false,
        expired: true,
        statusCode: error.statusCode,
      };
    }

    throw error;
  }
};
