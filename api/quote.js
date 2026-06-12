/* ============================================================
   AHL Wash — quote request endpoint (Vercel serverless function)
   Validates the lead, guards against abuse, emails it via Resend.
   Zero npm dependencies — uses Node's global fetch.
   ============================================================ */

const LEADS_TO = process.env.LEADS_TO_EMAIL || "ahlwashinfo@gmail.com";
// Until ahlwash.com is verified in Resend, only this onboarding sender works.
const FROM = process.env.LEADS_FROM_EMAIL || "AHL Wash Website <onboarding@resend.dev>";

const SERVICES = [
  "Same-Week Driveway Revival ($150–$280)",
  "First Impressions Bundle ($220–$380)",
  "Full Property Renewal ($320–$550+)",
  "Not sure — just send me a quote",
];

/* best-effort per-IP throttle (resets when the serverless instance recycles) */
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;
const hits = new Map();

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const fail = (res, code, error) => res.status(code).json({ ok: false, error });

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return fail(res, 405, "Method not allowed.");
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};

  // Honeypot: bots that fill the hidden field get a quiet "success" and no email.
  if (str(body["bot-field"], 200)) return res.status(200).json({ ok: true });

  // Per-IP throttle
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    return fail(res, 429, "Too many requests. Text us at (703) 539-2129 instead.");
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // don't let the map grow unbounded

  // Server-side validation (mirrors the client rules)
  const firstName = str(body["first-name"], 100);
  const lastName = str(body["last-name"], 100);
  const phone = str(body.phone, 30);
  const zip = str(body.zip, 10);
  const address = str(body.address, 300);
  const service = str(body.service, 100);
  const details = str(body.details, 2000);

  if (!firstName || !lastName) return fail(res, 400, "Name is required.");
  if (!/^[\d\s()+\-.]{7,30}$/.test(phone)) return fail(res, 400, "Enter a valid phone number.");
  if (!/^\d{5}$/.test(zip)) return fail(res, 400, "Enter a 5-digit ZIP code.");
  if (address.length < 5) return fail(res, 400, "Service address is required.");
  if (!SERVICES.includes(service)) return fail(res, 400, "Please pick a service option.");

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set");
    return fail(res, 500, "The quote system is temporarily down. Text us at (703) 539-2129.");
  }

  const lines = [
    `Name:     ${firstName} ${lastName}`,
    `Phone:    ${phone}`,
    `ZIP:      ${zip}`,
    `Address:  ${address}`,
    `Package:  ${service}`,
    details ? `Details:  ${details}` : null,
    ``,
    `Reply fast — the site promises a quote in under 10 minutes.`,
  ].filter(Boolean);

  const rows = [
    ["Name", `${firstName} ${lastName}`],
    ["Phone", phone],
    ["ZIP", zip],
    ["Address", address],
    ["Package", service],
    ["Details", details || "—"],
  ]
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;font-weight:bold;vertical-align:top">${k}</td><td style="padding:6px 0">${escapeHtml(v)}</td></tr>`
    )
    .join("");

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [LEADS_TO],
        subject: `New quote request — ${firstName} ${lastName} (${zip})`,
        text: lines.join("\n"),
        html: `<h2 style="margin:0 0 12px">New quote request from ahlwash.com</h2><table style="font-size:15px">${rows}</table><p style="color:#777;margin-top:16px">Reply fast — the site promises a quote in under 10 minutes.</p>`,
      }),
    });

    if (!r.ok) {
      console.error("Resend error:", r.status, await r.text().catch(() => ""));
      return fail(res, 502, "Couldn't send your request. Text us at (703) 539-2129.");
    }
  } catch (err) {
    console.error("Resend request failed:", err.message);
    return fail(res, 502, "Couldn't send your request. Text us at (703) 539-2129.");
  }

  return res.status(200).json({ ok: true });
};
