import { openCalculator, type CalculatorPrefill } from "@solar/core";

type CalculatorClick = {
  button: number;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  preventDefault(): void;
};

export function isPlainClick(event: CalculatorClick): boolean {
  return event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
}

export function handleCalculatorClick(
  event: CalculatorClick,
  prefill: CalculatorPrefill,
  open: (prefill: CalculatorPrefill) => void = openCalculator,
): void {
  if (!isPlainClick(event)) return;
  event.preventDefault();
  open(prefill);
}
