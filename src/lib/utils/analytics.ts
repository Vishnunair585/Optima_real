import { trackEventFn } from "../api/analytics.functions";

class TelemetrySDK {
  private sessionIdKey = "optima_session_id";
  private consentKey = "optima_cookie_consent";
  private eventQueue: any[] = [];
  private batchTimeout: any = null;

  constructor() {
    if (typeof window !== "undefined") {
      // Ensure session exists
      this.getSessionId();
      // Listen to page unloads to flush queue
      window.addEventListener("beforeunload", () => this.flushQueue());
    }
  }

  // Retrieve or generate unique Session ID
  public getSessionId(): string {
    if (typeof window === "undefined") return "ssr";
    let sid = sessionStorage.getItem(this.sessionIdKey);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(this.sessionIdKey, sid);
    }
    return sid;
  }

  // GDPR Consent Configuration
  public setConsent(granted: boolean) {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.consentKey, granted ? "granted" : "denied");
      this.track("Consent Updated", { granted });
    }
  }

  public hasConsent(): boolean {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(this.consentKey) !== "denied";
  }

  // Parse Client Telemetry Metadata
  private getClientMetadata() {
    if (typeof window === "undefined") return {};
    const ua = navigator.userAgent;
    
    // Browser detect
    let browser = "Other";
    if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edge")) browser = "Edge";

    // Device detect
    let device = "Desktop";
    if (/Mobi|Android|iPhone/i.test(ua)) device = "Mobile";
    else if (/Tablet|iPad/i.test(ua)) device = "Tablet";

    return {
      browser,
      device,
      country: "United States", // Default country fallback (or resolved on server-side IP check)
      page_url: window.location.href,
      referrer: document.referrer || "Direct"
    };
  }

  // Ingest/Track Event
  public track(eventName: string, metadata: Record<string, any> = {}) {
    if (!this.hasConsent()) return;

    const event = {
      id: crypto.randomUUID(),
      event_name: eventName,
      page_url: typeof window !== "undefined" ? window.location.pathname : "/",
      session_id: this.getSessionId(),
      metadata: {
        ...this.getClientMetadata(),
        ...metadata,
        timestamp: Date.now()
      }
    };

    // 1. Push to internal batch queue
    this.eventQueue.push(event);
    this.scheduleBatchFlush();

    // 2. Trigger PostHog (if initialized)
    if (typeof window !== "undefined" && (window as any).posthog) {
      try {
        (window as any).posthog.capture(eventName, metadata);
      } catch (err) {
        console.warn("PostHog event capture failed:", err);
      }
    }

    // 3. Trigger Google Analytics (if initialized)
    if (typeof window !== "undefined" && (window as any).gtag) {
      try {
        (window as any).gtag("event", eventName, metadata);
      } catch (err) {
        console.warn("GA4 event tracking failed:", err);
      }
    }

    // 4. Trigger Microsoft Clarity (if initialized)
    if (typeof window !== "undefined" && (window as any).clarity) {
      try {
        (window as any).clarity("event", eventName, metadata);
      } catch (err) {
        console.warn("Clarity event logging failed:", err);
      }
    }
  }

  // Page View Helper
  public pageView(url: string) {
    this.track("Page View", { path: url });
  }

  // Batching & Queue Flush
  private scheduleBatchFlush() {
    if (this.batchTimeout) return;
    this.batchTimeout = setTimeout(() => {
      this.flushQueue();
    }, 4000); // Batch and flush every 4 seconds
  }

  private async flushQueue() {
    this.batchTimeout = null;
    if (this.eventQueue.length === 0) return;

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Send batched events to local database via server function
      await trackEventFn({ events: eventsToFlush });
    } catch (err) {
      console.error("Telemetry queue flush failed:", err);
      // Re-queue on failure to prevent data loss
      this.eventQueue = [...eventsToFlush, ...this.eventQueue];
    }
  }
}

export const OptimaAnalytics = new TelemetrySDK();
