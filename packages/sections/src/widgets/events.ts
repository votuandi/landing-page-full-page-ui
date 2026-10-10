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
