const APP_STORE_URL = "https://apps.apple.com/us/app/gracewell/id6760741742";

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) el.textContent = I18N.t(key);
  });
  document.documentElement.lang = I18N.locale === "es" ? "es" : "en";
}

function getPayloadParam() {
  return new URLSearchParams(window.location.search).get("p");
}

function base64UrlDecode(input) {
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  if (pad) {
    base64 += "=".repeat(4 - pad);
  }
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

function decodePayload(encoded) {
  if (!encoded) return null;
  try {
    const json = base64UrlDecode(encoded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function peekPayloadLocale(encoded) {
  const payload = decodePayload(encoded);
  if (payload && typeof payload.l === "string") {
    const l = payload.l.slice(0, 2).toLowerCase();
    if (l === "es" || l === "en") return l;
  }
  return null;
}

function isValidPayloadShape(payload) {
  if (!payload || typeof payload !== "object") return false;
  if (!["v", "p", "c"].includes(payload.k)) return false;
  if (typeof payload.b !== "string" || payload.b.trim().length === 0) return false;
  if (payload.r != null && typeof payload.r !== "string") return false;
  if (payload.t != null && typeof payload.t !== "string") return false;
  if (payload.l != null && typeof payload.l !== "string") return false;
  return true;
}

function matchesPageKind(payload, pageKind) {
  if (pageKind === "verse") return payload.k === "v";
  if (pageKind === "prayer") return payload.k === "p";
  if (pageKind === "carry") return payload.k === "c";
  return false;
}

function hideAllStates() {
  ["loadingState", "contentState", "unavailableState", "missingState", "invalidState"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });
}

function showState(id) {
  hideAllStates();
  document.getElementById(id)?.classList.remove("hidden");
}

function openAppHrefForPage(pageKind, encoded) {
  if (!encoded) return "gracewell://";
  const seg = pageKind === "prayer" ? "prayer" : pageKind === "carry" ? "carry" : "verse";
  return `gracewell://share/${seg}?p=${encodeURIComponent(encoded)}`;
}

function wireDownloadButtons() {
  ["downloadButton", "downloadFallbackButton", "downloadMissingButton", "downloadInvalidButton"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = APP_STORE_URL;
  });
}

function setOpenAppHrefs(pageKind, encoded) {
  const href = openAppHrefForPage(pageKind, encoded);
  ["openAppButton", "openAppMissingButton", "openAppInvalidButton"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = href;
  });
}

function showMissingState(pageKind) {
  showState("missingState");
  wireDownloadButtons();
  setOpenAppHrefs(pageKind, null);
}

function showInvalidState(pageKind, encoded) {
  showState("invalidState");
  wireDownloadButtons();
  setOpenAppHrefs(pageKind, encoded || null);
}

function chipLabelForKind(pageKind) {
  if (pageKind === "verse") return I18N.t("share.verse.label");
  if (pageKind === "prayer") return I18N.t("share.prayer.label");
  return I18N.t("share.carry.label");
}

function renderPayload(payload, pageKind, encoded) {
  showState("contentState");

  const chip = document.getElementById("shareChip");
  const body = document.getElementById("shareBody");
  const reference = document.getElementById("shareReference");
  const title = document.getElementById("shareTitle");
  const theme = document.getElementById("shareTheme");

  if (chip) chip.textContent = chipLabelForKind(pageKind);
  if (body) body.textContent = payload.b || "";

  if (reference) {
    if (payload.r) {
      reference.textContent = payload.r;
      reference.classList.remove("hidden");
    } else {
      reference.textContent = "";
      reference.classList.add("hidden");
    }
  }

  if (title) {
    if (pageKind === "prayer" && payload.t) {
      title.textContent = payload.t;
      title.classList.remove("hidden");
    } else {
      title.textContent = "";
      title.classList.add("hidden");
    }
  }

  if (theme) {
    if (pageKind === "verse" && payload.t) {
      theme.textContent = payload.t;
      theme.classList.remove("hidden");
    } else {
      theme.textContent = "";
      theme.classList.add("hidden");
    }
  }

  wireDownloadButtons();
  setOpenAppHrefs(pageKind, encoded);
}

async function initSharePage() {
  const encoded = getPayloadParam();
  const payloadLocale = peekPayloadLocale(encoded);
  const locale = detectLocale({ payloadLocale });
  localStorage.setItem("gw_lang", locale);
  await I18N.load(locale);
  applyTranslations();

  const pageKind = document.body.dataset.shareKind || "verse";

  if (!encoded) {
    showMissingState(pageKind);
    return;
  }

  const payload = decodePayload(encoded);
  if (!isValidPayloadShape(payload) || !matchesPageKind(payload, pageKind)) {
    showInvalidState(pageKind, encoded);
    return;
  }

  renderPayload(payload, pageKind, encoded);
}

document.addEventListener("DOMContentLoaded", initSharePage);
