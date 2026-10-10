import { fixture } from "./fixtures";

/** v1 → v2: thêm nhãn đính kèm dự toán, giữ nguyên nội dung đã tùy biến. */
export function migrateQuoteCartV1(data: Record<string, unknown>) {
  return {
    ...data,
    attachEstimateLabel: data.attachEstimateLabel ?? fixture.attachEstimateLabel,
    estimateSummary: data.estimateSummary ?? fixture.estimateSummary,
  };
}
