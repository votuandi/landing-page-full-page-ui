/**
 * zod 4 probes `new Function("")` unless `jitless` is set; under a CSP without 'unsafe-eval' the browser reports that
 * caught probe as a `securitypolicyviolation` (E14-S04). zod reads `globalThis.__zod_globalConfig` when it builds schemas,
 * so this inline script must run in <head>, before any chunk.
 */
export const ZOD_JITLESS_SCRIPT = "(globalThis.__zod_globalConfig=globalThis.__zod_globalConfig||{}).jitless=true;";
