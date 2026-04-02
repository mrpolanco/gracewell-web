/**
 * Minimal i18n for share landing pages (en / es).
 */
const I18N = {
  locale: "en",
  strings: {},

  async load(locale) {
    const normalized = locale === "es" ? "es" : "en";
    this.locale = normalized;
    const path = normalized === "es" ? "/locales/es.json" : "/locales/en.json";
    const res = await fetch(path);
    if (!res.ok) throw new Error("locale_load_failed");
    this.strings = await res.json();
  },

  t(path) {
    const parts = path.split(".");
    let cur = this.strings;
    for (const p of parts) {
      if (cur == null || typeof cur !== "object") return path;
      cur = cur[p];
    }
    return typeof cur === "string" ? cur : path;
  },
};

/**
 * @param {{ payloadLocale?: string | null } | undefined} [opts]
 */
function detectLocale(opts) {
  const params = new URLSearchParams(window.location.search);
  const forced = params.get("lang");
  if (forced === "es" || forced === "en") return forced;

  if (opts && (opts.payloadLocale === "es" || opts.payloadLocale === "en")) {
    return opts.payloadLocale;
  }

  const stored = localStorage.getItem("gw_lang");
  if (stored === "es" || stored === "en") return stored;

  const nav = (navigator.language || "en").toLowerCase();
  if (nav.startsWith("es")) return "es";
  return "en";
}
