export declare const CAPACITOR_ORIGINS: string[];
export interface CorsConfig {
    origins: Set<string>;
    /** "*" honoured (development only). */
    allowAll: boolean;
    /** "*" was listed but ignored because NODE_ENV is production. */
    wildcardIgnored: boolean;
}
export declare function parseCorsOrigins(raw: string | undefined, isProduction: boolean): CorsConfig;
export declare function isOriginAllowed(origin: string | undefined, cfg: CorsConfig): boolean;
//# sourceMappingURL=cors.d.ts.map