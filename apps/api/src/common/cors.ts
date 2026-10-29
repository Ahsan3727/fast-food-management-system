// Origins used by the Capacitor Android/iOS WebView. Always allowed, so the
// customer, rider and admin APKs keep working whatever CORS_ORIGINS says.
export const CAPACITOR_ORIGINS = ['capacitor://localhost', 'http://localhost', 'https://localhost'];

export interface CorsConfig {
  origins: Set<string>;
  /** "*" honoured (development only). */
  allowAll: boolean;
  /** "*" was listed but ignored because NODE_ENV is production. */
  wildcardIgnored: boolean;
}

export function parseCorsOrigins(raw: string | undefined, isProduction: boolean): CorsConfig {
  // Trailing slashes are stripped: browsers never send one, but env values often have one.
  const listed = (raw ?? '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  const wildcard = listed.includes('*');
  return {
    origins: new Set([...listed.filter((o) => o !== '*'), ...CAPACITOR_ORIGINS]),
    allowAll: wildcard && !isProduction,
    wildcardIgnored: wildcard && isProduction,
  };
}

export function isOriginAllowed(origin: string | undefined, cfg: CorsConfig): boolean {
  if (!origin) return true; // non-browser clients send no Origin header
  return cfg.allowAll || cfg.origins.has(origin);
}
