import { dom } from "./domGlobals.ts";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";

export let confirmAnswer = true;
export const setConfirm = (answer: boolean) => { confirmAnswer = answer; };
dom.window.confirm = () => confirmAnswer;

export type Mounted = { container: HTMLElement; root: Root; unmount(): void };

export async function mount(node: ReactNode): Promise<Mounted> {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => root.render(node));
  return { container, root, unmount: () => { act(() => root.unmount()); container.remove(); } };
}

/** Input có id kết thúc bằng đường dẫn trường (id = `<useId>-<a.b.0>`). */
export function byPath<T extends HTMLElement = HTMLInputElement>(container: HTMLElement, path: string): T {
  const element = [...container.querySelectorAll<T>("[id]")].find((el) => el.id.endsWith(`-${path}`));
  if (!element) throw new Error(`không thấy ô ${path}`);
  return element;
}

export async function type(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  const proto = Object.getPrototypeOf(element);
  const setter = Object.getOwnPropertyDescriptor(proto, "value")!.set!;
  await act(async () => {
    setter.call(element, value);
    element.dispatchEvent(new dom.window.Event(element.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
  });
}

export async function click(element: Element) {
  await act(async () => { (element as HTMLElement).click(); });
}

export function button(container: HTMLElement, name: string | RegExp): HTMLButtonElement {
  const match = (text: string) => (typeof name === "string" ? text === name : name.test(text));
  const found = [...container.querySelectorAll("button")].find((el) => match(el.getAttribute("aria-label") ?? el.textContent?.trim() ?? ""));
  if (!found) throw new Error(`không thấy nút ${name}`);
  return found;
}

export const submitButton = (container: HTMLElement) => container.querySelector<HTMLButtonElement>('button[type="submit"]')!;
