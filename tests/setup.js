/**
 * Imported first by every test file: keeps tests away from the developer's real .env
 * (payment, messaging and model credentials) so they never call live services.
 * DATABASE_URL and SEED_DEMO_PASSWORD must be passed in the environment.
 */

import { fileURLToPath } from "url";

process.env.DOTENV_CONFIG_PATH = fileURLToPath(new URL("./no-such.env", import.meta.url));
for (const key of [
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "ANTHROPIC_API_KEY",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "NODE_ENV"
]) {
  delete process.env[key];
}
