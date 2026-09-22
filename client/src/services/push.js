import api from "./api";

const getPushSubscription = async () => {
  console.log("1. Checking Service Worker");

  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Worker is not supported by this browser.");
  }

  console.log("2. Service Worker supported");

  if (!("PushManager" in window)) {
    throw new Error("Push notifications are not supported by this browser.");
  }

  console.log("3. PushManager supported");

  const permission = await Notification.requestPermission();

  console.log("4. Notification permission:", permission);

  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  console.log("5. Waiting for Service Worker");

  const registration = await navigator.serviceWorker.ready;

  console.log("6. Service Worker ready:", registration);

  const existingSubscription = await registration.pushManager.getSubscription();

  console.log("7. Existing subscription:", existingSubscription);

  if (existingSubscription) {
    return existingSubscription;
  }

  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

  console.log("8. VAPID public key exists:", Boolean(publicKey));

  if (!publicKey) {
    throw new Error("VITE_VAPID_PUBLIC_KEY is not configured.");
  }

  console.log("9. Creating push subscription");

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,

    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  console.log("10. Push subscription created:", subscription);

  return subscription;
};

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

export const subscribeToPush = async () => {
  const subscription = await getPushSubscription();

  await api.post("/images/push/subscribe", {
    subscription,
  });

  return subscription;
};
