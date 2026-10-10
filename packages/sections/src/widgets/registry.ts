import { createRegistry } from "../registry";
import { variants as contact_dock } from "./contact-dock";
import { variants as consult_popup } from "./consult-popup";
import { variants as mobile_bottom_nav } from "./mobile-bottom-nav";
import { variants as commitments_strip } from "./commitments-strip";
import { variants as quote_cart } from "./quote-cart";
import { variants as theme_switch } from "./theme-switch";
import { variants as scroll_progress } from "./scroll-progress";

export const widgetRegistry = createRegistry({
  "contact-dock": contact_dock,
  "consult-popup": consult_popup,
  "mobile-bottom-nav": mobile_bottom_nav,
  "commitments-strip": commitments_strip,
  "quote-cart": quote_cart,
  "theme-switch": theme_switch,
  "scroll-progress": scroll_progress,
});
export const WIDGET_SLOTS = {
  "contact-dock": "overlay",
  "consult-popup": "overlay",
  "mobile-bottom-nav": "overlay",
  "commitments-strip": "inline",
  "quote-cart": "overlay",
  "theme-switch": "overlay",
  "scroll-progress": "overlay",
} as const;
