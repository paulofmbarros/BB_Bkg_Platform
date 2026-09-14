import type { CSSProperties } from "react";

export const money = (minor: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: minor % 100 === 0 ? 0 : 2,
  }).format(minor / 100);
export const initials = (name: string) =>
  name
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("");

const rgb = (hex: string) =>
  [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));

const luminance = (hex: string) => {
  const channels = rgb(hex)
    .map((channel) => channel / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

export function contrastRatio(first: string, second: string) {
  const [lighter, darker] = [luminance(first), luminance(second)].sort(
    (a, b) => b - a,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

export function contrastText(hex: string) {
  return luminance(hex) > 0.179 ? "#151b18" : "#ffffff";
}

function mix(first: string, second: string, secondWeight: number) {
  const firstRgb = rgb(first);
  const secondRgb = rgb(second);
  return `#${firstRgb
    .map((channel, index) =>
      Math.round(channel * (1 - secondWeight) + secondRgb[index] * secondWeight)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function readableAccent(accent: string, backgrounds: string[]) {
  for (let step = 0; step <= 20; step++) {
    const candidate = mix(accent, "#151b18", step / 20);
    if (
      backgrounds.every(
        (background) => contrastRatio(candidate, background) >= 4.5,
      )
    )
      return candidate;
  }
  return "#151b18";
}

export type ShopTheme = CSSProperties & Record<`--shop-${string}`, string>;

export function shopTheme(rawAccent: string): ShopTheme {
  const accent = rawAccent.toLowerCase();
  const surface = mix(accent, "#ffffff", 0.93);
  const surfaceStrong = mix(accent, "#ffffff", 0.84);
  const border = mix(accent, "#ffffff", 0.72);
  const accentText = readableAccent(accent, ["#ffffff", surfaceStrong]);
  const muted = readableAccent(mix(accentText, "#696963", 0.45), [
    "#ffffff",
    surfaceStrong,
  ]);
  return {
    "--shop-accent": accent,
    "--shop-on-accent": contrastText(accent),
    "--shop-accent-text": accentText,
    "--shop-ink": mix(accentText, "#181b18", 0.45),
    "--shop-muted": muted,
    "--shop-surface": surface,
    "--shop-surface-strong": surfaceStrong,
    "--shop-border": border,
  };
}
