"use client";

import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";

// Cloudflare Turnstile widget. Mirror of spattoo-core's auth/Captcha.jsx and spattoo-admin's — same
// cross-repo mirror pattern the password policy uses.
//
// ⚠️ ONE DIFFERENCE, AND IT MATTERS. Those two exist for a Supabase auth call, where SUPABASE
// verifies the token and we hold no secret. This one guards an endpoint of OUR OWN, so our API does
// the verifying (services/turnstile.js). The widget is only half of it: a token nobody checks is
// decoration, because a script posting straight at the API never loaded this page and so never had
// one to begin with.
//
// Renders nothing without a site key, so a deploy that has not set NEXT_PUBLIC_TURNSTILE_SITE_KEY
// simply has no captcha — matching how the backend treats an unset secret.

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

declare global {
  interface Window { turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; reset: (id: string) => void; remove: (id: string) => void } }
}

// Loaded exactly once per page, however many widgets ask for it.
let scriptPromise: Promise<void> | null = null;
function loadTurnstile(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const el = document.createElement("script");
    el.src = SCRIPT_SRC;
    el.async = true;
    el.defer = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error("Turnstile failed to load"));
    document.head.appendChild(el);
  });
  return scriptPromise;
}

export interface CaptchaHandle { reset: () => void }

interface Props {
  siteKey?: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

// `reset()` is exposed because Turnstile tokens are SINGLE-USE and expire in about five minutes. A
// form that failed for any reason — a rate limit, a network blip — must get a fresh token before the
// visitor tries again, or the retry fails for a second, unrelated reason and looks like the form is
// simply broken.
const Captcha = forwardRef<CaptchaHandle, Props>(function Captcha({ siteKey, onVerify, onExpire }, ref) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);
  // Held in refs so a re-render never re-creates the widget: rendering it twice would show two
  // checkboxes and issue a token the form is not holding.
  const onVerifyRef = useRef(onVerify);
  onVerifyRef.current = onVerify;
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    },
  }), []);

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;
    loadTurnstile()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile || widgetId.current) return;
        widgetId.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: "dark",                 // the modal is dark; the default light widget sits on it badly
          callback: (token: string) => onVerifyRef.current(token),
          "expired-callback": () => onExpireRef.current?.(),
          "error-callback": () => onExpireRef.current?.(),
        });
      })
      .catch(() => { /* no widget → no token → the API refuses. Nothing to say here. */ });
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try { window.turnstile.remove(widgetId.current); } catch { /* already gone */ }
        widgetId.current = null;
      }
    };
  }, [siteKey]);

  if (!siteKey) return null;
  return <div ref={containerRef} />;
});

export default Captcha;
