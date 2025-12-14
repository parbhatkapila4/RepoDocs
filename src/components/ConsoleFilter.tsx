"use client";

import { useEffect } from "react";

export function ConsoleFilter() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const originalLog = console.log;
    const originalInfo = console.info;
    const originalWarn = console.warn;
    const originalError = console.error;

    const shouldSuppress = (args: any[]): boolean => {
      const message = args[0];
      if (typeof message === "string") {
        if (message.includes("[Fast Refresh]")) {
          return true;
        }
        if (message.includes("forward-logs-shared")) {
          return true;
        }
      }
      return false;
    };

    console.log = (...args: any[]) => {
      if (!shouldSuppress(args)) {
        originalLog.apply(console, args);
      }
    };

    console.info = (...args: any[]) => {
      if (!shouldSuppress(args)) {
        originalInfo.apply(console, args);
      }
    };

    console.warn = (...args: any[]) => {
      if (!shouldSuppress(args)) {
        originalWarn.apply(console, args);
      }
    };

    return () => {
      console.log = originalLog;
      console.info = originalInfo;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  return null;
}
