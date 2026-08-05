"use client";

import { useEffect, useState } from "react";
import { enablePush, pushSupported } from "../lib/push";
import type { makeBakerApiClient } from "../lib/bakerApi";

// ── "Tell me when an enquiry arrives" ────────────────────────────────────────────────────────────
// The permission ask, behind a button, because a browser ignores a request that did not follow a
// click — and Chrome blocks the prompt entirely for origins that ask on load. So the button is the
// mechanism, not the manners.
//
// It renders NOTHING when push is unavailable or already on. A dead control is worse than no
// control: a baker who taps it and sees nothing happen concludes the feature is broken.

type State = "checking" | "unavailable" | "ready" | "working" | "on" | "refused";

type Api = ReturnType<typeof makeBakerApiClient>;

export default function EnableNotifications({ api }: { api?: Pick<Api, "registerDeviceToken"> }) {
  const [state, setState] = useState<State>("checking");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    pushSupported().then((ok) => {
      if (!alive) return;
      if (!ok) return setState("unavailable");
      // Already granted in a previous session — re-fetching the token is cheap and keeps a rotated
      // one current, which is how a device quietly stops receiving otherwise.
      if (Notification.permission === "granted") {
        enablePush().then((t) => { if (alive) { setToken(t); setState("on"); } }).catch(() => alive && setState("ready"));
        return;
      }
      setState(Notification.permission === "denied" ? "refused" : "ready");
    });
    return () => { alive = false; };
  }, []);

  // The API is what turns a token into "this baker's phone". Registering is idempotent (the route
  // upserts), so re-running on every mount is deliberate: it also refreshes last_seen_at and moves
  // the row if the device changed hands.
  //
  // Failure is swallowed on purpose — the baker asked for notifications and got the browser's
  // permission; a backend hiccup should not present that as a refusal. The next mount retries.
  useEffect(() => {
    if (!token || !api?.registerDeviceToken) return;
    api.registerDeviceToken(token, "web").catch(() => {});
  }, [token, api]);

  if (state === "checking" || state === "unavailable") return null;

  // Denied is not retryable from script — only the browser's own site settings can undo it, so the
  // honest thing is to say where rather than offer a button that cannot work.
  if (state === "refused") {
    return <p style={s.note}>Notifications are blocked for this site. Turn them back on in your browser’s site settings.</p>;
  }

  if (state === "on") return <p style={s.note}>✓ Notifications are on for this device.</p>;

  return (
    <button
      type="button"
      style={s.btn}
      disabled={state === "working"}
      onClick={async () => {
        setState("working");
        try {
          const t = await enablePush();
          setToken(t);
          setState(t ? "on" : "refused");
        } catch {
          setState("ready");
        }
      }}
    >
      {state === "working" ? "Enabling…" : "Notify me about new enquiries"}
    </button>
  );
}

const s: Record<string, React.CSSProperties> = {
  btn: {
    padding: "9px 16px", borderRadius: 10, border: "none", background: "#3D5A44",
    color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
  },
  note: { fontSize: 12.5, color: "#6b6b6b", margin: 0 },
};
