import { openCalculator, type CalculatorPrefill } from "@solar/core";

type CalculatorClick = {
  button: number;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  preventDefault(): void;
};

export function handleCalculatorClick(
  event: CalculatorClick,
  prefill: CalculatorPrefill,
  open: (prefill: CalculatorPrefill) => void = openCalculator,
): void {
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  open(prefill);
}
