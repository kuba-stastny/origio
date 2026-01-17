// src/lib/logger.ts
type Level = "debug" | "info" | "warn" | "error";

function log(level: Level, msg: string, meta?: unknown) {
  const args = meta === undefined ? [msg] : [msg, meta];
  switch (level) {
    case "debug":
      if (process.env.NODE_ENV !== "production") console.debug(...args);
      break;
    case "info":
      console.info(...args);
      break;
    case "warn":
      console.warn(...args);
      break;
    case "error":
      console.error(...args);
      break;
  }
}

export const logger = {
  debug: (msg: string, meta?: unknown) => log("debug", msg, meta),
  info: (msg: string, meta?: unknown) => log("info", msg, meta),
  warn: (msg: string, meta?: unknown) => log("warn", msg, meta),
  error: (msg: string, meta?: unknown) => log("error", msg, meta),
};

// umožní i: import logger from "@/lib/logger";
export default logger;
