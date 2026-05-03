import { createRoot } from "react-dom/client";
import { I18nProvider } from "./i18n";
import { App } from "./App";
import "./index.css";

const themeInitScript = `(function(){try{var t=JSON.parse(localStorage.getItem('open-design:config')||'{}').theme;if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;
const s = document.createElement('script');
s.textContent = themeInitScript;
document.head.appendChild(s);

// --- Lightweight client-side error reporting -----------------------
// Reports uncaught errors and unhandled promise rejections to
// /api/error. Uses sendBeacon when available so reports survive
// page unload; falls back to fetch with `keepalive`. Throttled to
// max 5 reports per rolling 10s so a tight error loop can't burn
// the per-IP server cap (which is 20/hr) before the user even
// notices.
(function installErrorReporter() {
  const WINDOW_MS = 10_000;
  const MAX = 5;
  const recent: number[] = [];
  function allow(): boolean {
    const now = Date.now();
    while (recent.length && recent[0]! <= now - WINDOW_MS) recent.shift();
    if (recent.length >= MAX) return false;
    recent.push(now);
    return true;
  }
  function report(payload: Record<string, unknown>): void {
    if (!allow()) return;
    try {
      const body = JSON.stringify(payload);
      // sendBeacon caps payloads (~64 KB) and uses application/json
      // when given a Blob. Fallback to fetch keepalive otherwise.
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([body], { type: 'application/json' });
        const ok = navigator.sendBeacon('/api/error', blob);
        if (ok) return;
      }
      void fetch('/api/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => { /* swallow — never recurse */ });
    } catch {
      /* swallow — never recurse */
    }
  }
  window.addEventListener('error', (event) => {
    const err = event.error;
    report({
      source: 'window.error',
      message: event.message || (err instanceof Error ? err.message : 'unknown'),
      stack: err instanceof Error ? err.stack : null,
      url: window.location.href,
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message =
      reason instanceof Error ? reason.message : String(reason ?? 'unknown rejection');
    report({
      source: 'window.unhandledrejection',
      message,
      stack: reason instanceof Error ? reason.stack : null,
      url: window.location.href,
    });
  });
})();

createRoot(document.getElementById("root")!).render(
  <I18nProvider>
    <App />
  </I18nProvider>
);
