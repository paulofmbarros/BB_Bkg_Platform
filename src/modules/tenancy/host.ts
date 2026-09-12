export function normalizeHost(raw: string): string | null {
  if (!raw || /[\s/@\\?#]/.test(raw)) return null;
  const host = raw.toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  return /^[a-z0-9.-]+$/.test(host) ? host : null;
}

export function isWorkspaceHost(host: string, appOrigin: string): boolean {
  return host === new URL(appOrigin).hostname;
}
