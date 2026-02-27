import path from "path";
import { loadEnvConfig } from "@next/env";

// Load environment variables
const dev = process.env.NODE_ENV !== "production";
const { combinedEnv } = loadEnvConfig(process.cwd(), dev, {
  info: console.log,
  error: console.error,
});
Object.assign(process.env, combinedEnv);

// Re-export constants from shared normalization config
export {
  TARGET_AVG,
  MIN_REVIEWS_THRESHOLD,
  MIN_REVIEW_VALUE_THRESHOLD,
  ZSCORE_THRESHOLD,
} from "@/lib/normalization/config";

// CLI-specific constants
export const PROGRESS_FILE = path.join(
  process.cwd(),
  "acceptance-progress.json",
);
