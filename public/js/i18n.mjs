import translations from "../assets/text/translations.json" with { type: "json" };

const STORAGE_KEY = "web-hero-language";
const dynamicValues = new WeakMap();
const originalI18nHtml = new WeakMap();
const { messages, errors: errorTranslations } = translations;

export function translateError(error) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const pair = errorTranslations.find(([french, english]) =>
    language === "fr" ? english === message : french === message,
  );
  return pair ? pair[language === "fr" ? 0 : 1] : message;
}

function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (Object.hasOwn(messages, stored)) return stored;
  } catch {}
  if (typeof document === "undefined") return "fr";
  return globalThis.navigator?.language?.toLowerCase().startsWith("fr")
    ? "fr"
    : "en";
}

let language = readStoredLanguage();

function saveLanguage() {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {}
}

export function getLanguage() {
  return language;
}

export function formatNumber(value) {
  return new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US").format(
    value,
  );
}

export function t(key, values = {}) {
  const template = messages[language][key] ?? messages.fr[key] ?? key;
  return template.replace(/\{([\w]+)\}/g, (_, name) => {
    const value = values[name];
    return typeof value === "function" ? value() : (value ?? "");
  });
}

function translateElement(element) {
  const values = dynamicValues.get(element) || {};
  if (element.dataset.i18nHtml) {
    if (!originalI18nHtml.has(element))
      originalI18nHtml.set(element, element.innerHTML);
    element.innerHTML =
      messages[language][element.dataset.i18nHtml] ??
      originalI18nHtml.get(element);
  } else if (element.dataset.i18n)
    element.textContent = t(element.dataset.i18n, values);
  for (const item of (element.dataset.i18nAttrs || "").split(";")) {
    if (!item) continue;
    const [attribute, key] = item.split(":");
    if (attribute && key) element.setAttribute(attribute, t(key));
  }
}

export function setI18nText(element, key, values = {}) {
  dynamicValues.set(element, values);
  element.dataset.i18n = key;
  translateElement(element);
}

export function applyI18n(root = document) {
  document.documentElement.lang = language;
  root
    .querySelectorAll("[data-i18n], [data-i18n-html], [data-i18n-attrs]")
    .forEach(translateElement);
  document.querySelectorAll("[data-language]").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.language === language),
    );
  });
}

export function setLanguage(nextLanguage) {
  if (!(nextLanguage in messages)) return;
  language = nextLanguage;
  saveLanguage();
  applyI18n();
  document.dispatchEvent(new Event("webhero:languagechange"));
}

export function initI18n() {
  saveLanguage();
  document.querySelectorAll("[data-language]").forEach((button) => {
    button.addEventListener("click", () =>
      setLanguage(button.dataset.language),
    );
  });
  applyI18n();
}
