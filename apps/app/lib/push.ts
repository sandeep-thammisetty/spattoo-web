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
  // BOTH names accepted. The Firebase config field is `messagingSenderId`, so anyone copying from
  // the console names the var ..._MESSAGING_SENDER_ID — while the short form is what was documented
  // first. Getting it wrong produces `Missing App configuration value: "messagingSenderId"` from
  // deep inside the SDK, which says nothing about env vars at all. Cheaper to accept both than to
  // make every future operator decode that.
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
                  ?? process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID
                  ?? "",
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "";

// Which env var(s) supply each config field. Kept explicit so a failure can name the thing an
// operator actually sets — "messagingSenderId is missing" sends you looking for a config field;
// "NEXT_PUBLIC_FIREBASE_SENDER_ID is missing" sends you to the right screen.
const SOURCES: Record<string, string[]> = {
  apiKey:            ["NEXT_PUBLIC_FIREBASE_API_KEY"],
  authDomain:        ["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"],
  projectId:         ["NEXT_PUBLIC_FIREBASE_PROJECT_ID"],
  messagingSenderId: ["NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "NEXT_PUBLIC_FIREBASE_SENDER_ID"],
  appId:             ["NEXT_PUBLIC_FIREBASE_APP_ID"],
  vapidKey:          ["NEXT_PUBLIC_FIREBASE_VAPID_KEY"],
};

// Every value the SDK needs. Checked as a SET rather than on projectId alone: a config missing any
// one of these throws from inside Firebase with a message that names the field but not the
// environment variable behind it, at the moment a baker taps the button.
const MISSING = Object.entries({ ...config, vapidKey: VAPID_KEY })
  .filter(([, v]) => !v)
  .map(([k]) => k);

// Unconfigured is a NORMAL state, not an error: a host that has not set these should render no
// notification UI at all rather than a control that fails when tapped.
export const pushConfigured = () => MISSING.length === 0;

// Said once, at load, and only when SOME of it is present — a host that configured nothing is not
// misconfigured, it simply has no Firebase project. Half-configured is the case worth shouting
// about, because it looks configured right up until the click.
if (typeof window !== "undefined" && MISSING.length && MISSING.length < 6) {
  const wanted = MISSING.map(k => `${k} ← ${(SOURCES[k] ?? []).join(" or ")}`);
  console.warn(
    `[push] disabled — missing Firebase config:\n  ${wanted.join("\n  ")}\n` +
    `These are inlined at BUILD time, so a value set after the last build is not in this bundle. ` +
    `Check the var is set for the ENVIRONMENT you are loading (Vercel scopes Production, Preview ` +
    `and Development separately) and redeploy WITHOUT the build cache.`,
  );
  // What the bundle actually received, so "I set it" and "the build has it" stop being the same
  // claim. Values are public by design; the secret is the service account on the API.
  console.warn("[push] config as built:", { ...config, vapidKey: VAPID_KEY ? "(set)" : "" });
}

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

/**
 * Resolve once this registration has an ACTIVE worker.
 *
 * Watches the specific registration rather than `navigator.serviceWorker.ready`, which resolves for
 * whichever worker controls the PAGE — not necessarily this one, and not at all if the page is
 * uncontrolled on its first load.
 */
function activated(reg: ServiceWorkerRegistration): Promise<void> {
  if (reg.active) return Promise.resolve();
  const sw = reg.installing ?? reg.waiting;
  if (!sw) return navigator.serviceWorker.ready.then(() => undefined);

  return new Promise((resolve, reject) => {
    // A worker that fails to install never reaches 'activated', so without a timeout this would hang
    // and the baker would watch "Turning on…" forever.
    const timer = setTimeout(() => reject(new Error("service worker did not activate in time")), 10_000);
    sw.addEventListener("statechange", function onChange() {
      if (sw.state === "activated") {
        clearTimeout(timer);
        sw.removeEventListener("statechange", onChange);
        resolve();
      } else if (sw.state === "redundant") {
        clearTimeout(timer);
        sw.removeEventListener("statechange", onChange);
        reject(new Error("service worker became redundant before activating"));
      }
    });
  });
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

  // WAIT FOR IT TO BE ACTIVE. register() resolves as soon as the worker is REGISTERED, which on a
  // first load means it is still `installing` — and pushManager.subscribe() requires an ACTIVE
  // worker, failing with "Subscription failed - no active Service Worker".
  //
  // The bug only appears on the FIRST visit after a deploy, because afterwards the worker is
  // already activated and register() resolves against it. So it looks intermittent, and it lands on
  // exactly the baker who has never had notifications before.
  await activated(registration);

  return getToken(client(), { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
}

/**
 * What this device is, for diagnosing non-delivery (migration 056).
 *
 * ── WHAT A BROWSER CAN ACTUALLY TELL US ─────────────────────────────────────────────────────────
 * Very little, and that is expected rather than a bug to fix. `navigator.userAgent` is coarse and
 * Chrome freezes its version; the handset MODEL is available only via User-Agent Client Hints, only
 * on Chromium, and only by asking for high-entropy values. Safari reports none of it.
 *
 * So these are thin on web and fill in properly when the Capacitor apps report through the Device
 * plugin. Sending what we have beats sending nothing: "Android, Chrome" already separates an OEM
 * background-kill from an iOS install problem.
 *
 * DELIBERATELY NOT the full user-agent string. UA + screen + timezone + language is a fingerprint,
 * and a fingerprint is a tracking capability we would then have to justify holding.
 */
export async function deviceInfo(): Promise<{ deviceModel?: string; osVersion?: string; appVersion?: string }> {
  if (typeof navigator === "undefined") return {};
  const uaData = (navigator as Navigator & {
    userAgentData?: {
      platform?: string;
      getHighEntropyValues?: (h: string[]) => Promise<{ model?: string; platformVersion?: string }>;
    };
  }).userAgentData;

  let model: string | undefined;
  let platformVersion: string | undefined;
  try {
    // Chromium only, and it may still return empty strings — the browser decides what it is willing
    // to say. Guarded because Safari has no userAgentData at all.
    const high = await uaData?.getHighEntropyValues?.(["model", "platformVersion"]);
    model = high?.model || undefined;
    platformVersion = high?.platformVersion || undefined;
  } catch { /* the browser declined; thin data is the expected outcome here */ }

  const platform = uaData?.platform || navigator.platform || "web";
  return {
    deviceModel: model,
    osVersion:   [platform, platformVersion].filter(Boolean).join(" ") || undefined,
    // The build this browser is running, so "is this fixed for them yet" is answerable. Vercel
    // exposes the commit SHA; falls back to nothing rather than lying.
    appVersion:  process.env.NEXT_PUBLIC_RELEASE_SHA || undefined,
  };
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
