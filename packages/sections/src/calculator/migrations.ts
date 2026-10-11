/** v1 → v2: optional packageSimulation; retain the tariff estimator and all tenant overrides. */
export function migrateCalculatorV1(data: Record<string, unknown>) { return { ...data }; }
