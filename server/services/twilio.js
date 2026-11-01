/**
 * Cortex Hub - Twilio Communication Service
 * Implements SMS OTP, Phone Verification & WhatsApp AI Assistant (SRS §2.3, ADM-06)
 * Uses native fetch with HTTP Basic Auth (zero external dependencies).
 */

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || "";
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

function getAuthHeader() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error("Twilio credentials not configured in environment");
  }
  const token = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
  return `Basic ${token}`;
}

/**
 * Check Twilio account status and balance
 */
export async function getTwilioStatus() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return {
      configured: false,
      status: "NOT_CONFIGURED",
      message: "Twilio credentials missing in .env"
    };
  }

  try {
    const auth = getAuthHeader();

    // 1. Fetch Account info
    const accRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}.json`, {
      headers: { Authorization: auth }
    });

    if (!accRes.ok) {
      const err = await accRes.json().catch(() => ({}));
      return {
        configured: true,
        status: "ERROR",
        error: err.message || `Twilio HTTP ${accRes.status}`
      };
    }

    const accData = await accRes.json();

    // 2. Fetch Balance
    let balance = null;
    let currency = "USD";
    try {
      const balRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Balance.json`, {
        headers: { Authorization: auth }
      });
      if (balRes.ok) {
        const balData = await balRes.json();
        balance = balData.balance;
        currency = balData.currency;
      }
    } catch {
      // Balance fetch optional
    }

    return {
      configured: true,
      status: accData.status === "active" ? "ACTIVE" : accData.status,
      accountSid: `${TWILIO_ACCOUNT_SID.substring(0, 6)}••••••••${TWILIO_ACCOUNT_SID.substring(TWILIO_ACCOUNT_SID.length - 4)}`,
      friendlyName: accData.friendly_name,
      type: accData.type,
      balance: balance ? `${parseFloat(balance).toFixed(2)} ${currency}` : "N/A",
      whatsappNumber: TWILIO_WHATSAPP_NUMBER,
      smsNumberConfigured: Boolean(TWILIO_PHONE_NUMBER)
    };
  } catch (err) {
    return {
      configured: true,
      status: "NETWORK_ERROR",
      message: err.message
    };
  }
}

/**
 * Send an SMS or WhatsApp message via Twilio
 * @param {Object} options
 * @param {string} options.to - Recipient phone number (e.g. "+1234567890" or "whatsapp:+1234567890")
 * @param {string} options.body - Message text
 * @param {boolean} [options.isWhatsApp=false] - Whether to route via WhatsApp
 */
export async function sendTwilioMessage({ to, body, isWhatsApp = false }) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error("Twilio is not configured");
  }

  let from = isWhatsApp ? TWILIO_WHATSAPP_NUMBER : TWILIO_PHONE_NUMBER;
  let targetTo = to;

  if (isWhatsApp) {
    if (!targetTo.startsWith("whatsapp:")) {
      targetTo = `whatsapp:${targetTo}`;
    }
    if (!from.startsWith("whatsapp:")) {
      from = `whatsapp:${from}`;
    }
  }

  if (!from) {
    throw new Error(
      isWhatsApp
        ? "TWILIO_WHATSAPP_NUMBER is required"
        : "TWILIO_PHONE_NUMBER is required. (For WhatsApp, specify isWhatsApp: true to use the Twilio Sandbox number)."
    );
  }

  const formData = new URLSearchParams();
  formData.append("From", from);
  formData.append("To", targetTo);
  formData.append("Body", body);

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formData.toString()
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Twilio error ${res.status}`);
  }

  return {
    success: true,
    messageSid: data.sid,
    status: data.status,
    to: data.to,
    from: data.from,
    dateCreated: data.date_created
  };
}
