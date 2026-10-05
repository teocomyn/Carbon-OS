"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { readBrowserStorage } from "@/lib/browser-storage";

export function PrivacyAnalytics() {
  return (
    <Analytics
      beforeSend={(event: BeforeSendEvent) => {
        const privacyNavigator = navigator as Navigator & {
          globalPrivacyControl?: boolean;
        };
        if (
          privacyNavigator.globalPrivacyControl === true ||
          navigator.doNotTrack === "1" ||
          readBrowserStorage("va-disable") === "1"
        )
          return null;

        const url = new URL(event.url);
        url.search = "";
        url.hash = "";
        return { ...event, url: url.toString() };
      }}
    />
  );
}
