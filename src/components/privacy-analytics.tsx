"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

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
          localStorage.getItem("va-disable") === "1"
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
