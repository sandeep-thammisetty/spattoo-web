"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported, type Messaging } from "firebase/messaging";

// ── Web push, via Firebase Cloud Messaging ───────────────────────────────────────────────────────
// FCM rather than raw VAPID web-push, deliberately: the same send path, token shape and provider
// module serve a browser today and the Capacitor apps later. Raw web-push would work in a browser
// and then have to be thrown away and rebuilt against FCM for iOS and Android.
//
// Every value here is public by design — they identify the Firebase project and authorise nothing.
// The secret is the service-account key, which lives on the API.
const config = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID ?? "",
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "";

// Unconfigured is a NORMAL state, not an error: a host that has not set these should render no
// notification UI at all rather than a control that fails when tapped.
export const pushConfigured = () => !!config.projectId && !!VAPID_KEY;

/**
 * Can this browser receive push at all?
 *
 * On iOS this is false in a Safari TAB and true once the app is on the home screen — Apple gates the
 * Push API on being installed. So a false here is often "not installed yet" rather than "never", and
 * the caller is expected to say so rather than hiding the feature.
 */
export async function pushSupported(): Promise<boolean> {
  if (typeof window === "undefined" || !pushConfigured()) return false;
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return false;
  return isSupported().catch(() => false);
}

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

function client(): Messaging {
  if (!app) app = getApps()[0] ?? initializeApp(config);
  if (!messaging) messaging = getMessaging(app);
  return messaging;
}

/**
 * Ask for permission and return this device's FCM token, or null if the baker said no.
 *
 * MUST be called from a user gesture. Browsers ignore a permission request that did not follow a
 * click, and Chrome punishes origins that ask on load by blocking the prompt outright — so the
 * button is not politeness, it is the only thing that works.
 */
export async function enablePush(): Promise<string | null> {
  if (!(await pushSupported())) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  // The config travels in the query string because a service worker is a static file with no access
  // to NEXT_PUBLIC_* — see the note in firebase-messaging-sw.js.
  const registration = await navigator.serviceWorker.register(
    `/firebase-messaging-sw.js?${new URLSearchParams(config).toString()}`,
  );

  return getToken(client(), { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
}

/**
 * Messages that arrive while the app is in the FOREGROUND.
 *
 * FCM deliberately does not show a system notification in this case — the user is already looking at
 * the app, and an OS banner over the thing it is telling you about is noise. The service worker
 * never sees these. Wire this to an in-app toast; ignoring it means a baker with the app open is the
 * only baker who misses the alert.
 */
export function onForegroundPush(handler: (n: { title: string; body: string; url?: string }) => void) {
  if (!pushConfigured() || typeof window === "undefined") return () => {};
  return onMessage(client(), (payload) => {
    const d = payload.data ?? {};
    handler({ title: d.title ?? "Spattoo", body: d.body ?? "", url: d.url });
  });
}
