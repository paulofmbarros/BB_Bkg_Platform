import type { Locale } from "@/i18n/locales";

export function customerDate(instant: string, locale: Locale = "en") {
  return new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", {
    timeZone: "Europe/Lisbon",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(instant));
}
