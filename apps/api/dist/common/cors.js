"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CAPACITOR_ORIGINS = void 0;
exports.parseCorsOrigins = parseCorsOrigins;
exports.isOriginAllowed = isOriginAllowed;
// Origins used by the Capacitor Android/iOS WebView. Always allowed, so the
// customer, rider and admin APKs keep working whatever CORS_ORIGINS says.
exports.CAPACITOR_ORIGINS = ['capacitor://localhost', 'http://localhost', 'https://localhost'];
function parseCorsOrigins(raw, isProduction) {
    // Trailing slashes are stripped: browsers never send one, but env values often have one.
    const listed = (raw ?? '')
        .split(',')
        .map((o) => o.trim().replace(/\/+$/, ''))
        .filter(Boolean);
    const wildcard = listed.includes('*');
    return {
        origins: new Set([...listed.filter((o) => o !== '*'), ...exports.CAPACITOR_ORIGINS]),
        allowAll: wildcard && !isProduction,
        wildcardIgnored: wildcard && isProduction,
    };
}
function isOriginAllowed(origin, cfg) {
    if (!origin)
        return true; // non-browser clients send no Origin header
    return cfg.allowAll || cfg.origins.has(origin);
}
//# sourceMappingURL=cors.js.map