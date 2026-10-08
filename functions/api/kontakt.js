/**
 * Cloudflare Pages Function: POST /api/kontakt
 * Envía el lead a env.KONTAKT_WEBHOOK_URL si está configurada.
 * No registrar datos personales en logs.
 */

const ALLOWED_PAKKE = new Set(["start", "pluss", "nettbutikk", "usikker"]);
const ALLOWED_SPRRAK = new Set(["nb", "es", "en"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function clip(value, max) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const honeypot = clip(data.website, 100);
  if (honeypot) {
    return json({ ok: true });
  }

  const navn = clip(data.navn, 120);
  const epost = clip(data.epost, 200).toLowerCase();
  const samtykke = data.samtykke === true;
  const pakke = clip(data.pakke, 40).toLowerCase();
  const pageLang = data.pageLang === "es" ? "es" : "nb";

  if (!navn) return json({ ok: false, error: "invalid_navn" }, 400);
  if (!EMAIL_RE.test(epost)) return json({ ok: false, error: "invalid_email" }, 400);
  if (!samtykke) return json({ ok: false, error: "consent_required" }, 400);
  if (!ALLOWED_PAKKE.has(pakke)) return json({ ok: false, error: "invalid_pakke" }, 400);

  let sprak = Array.isArray(data.sprak) ? data.sprak : [];
  sprak = sprak
    .map((s) => String(s).toLowerCase().slice(0, 5))
    .filter((s) => ALLOWED_SPRRAK.has(s));

  const webhook = env && env.KONTAKT_WEBHOOK_URL;
  if (!webhook) {
    return json({ ok: false, error: "not_configured" }, 503);
  }

  const payload = {
    source: "hallobot",
    pageLang,
    timestamp: new Date().toISOString(),
    navn,
    bedrift: clip(data.bedrift, 150),
    epost,
    telefon: clip(data.telefon, 40),
    nettside: clip(data.nettside, 200),
    sprak,
    melding: clip(data.melding, 4000),
    pakke
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!res.ok) {
      return json({ ok: false, error: "upstream" }, 502);
    }
    return json({ ok: true });
  } catch {
    clearTimeout(timer);
    return json({ ok: false, error: "upstream" }, 502);
  }
}
