const CONSULT = "t15:open-consult";
const MENU = "t15:toggle-site-menu";
function emit(name: string) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(name));
}
function listen(name: string, handler: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(name, handler);
  return () => window.removeEventListener(name, handler);
}
export const openConsult = () => emit(CONSULT);
export const onOpenConsult = (handler: () => void) => listen(CONSULT, handler);
export const toggleSiteMenu = () => emit(MENU);
export const onToggleSiteMenu = (handler: () => void) => listen(MENU, handler);

const LOCALE = "t15:set-locale";
/** Header phát khi người dùng chọn VI/EN; app (LangProvider) lưu lựa chọn và dịch phần giao diện client. */
export const setSiteLocale = (locale: "vi" | "en") => {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(LOCALE, { detail: locale }));
};
export const onSetSiteLocale = (handler: (locale: "vi" | "en") => void) => {
  if (typeof window === "undefined") return () => {};
  const listener = (event: Event) => handler((event as CustomEvent<"vi" | "en">).detail);
  window.addEventListener(LOCALE, listener);
  return () => window.removeEventListener(LOCALE, listener);
};
