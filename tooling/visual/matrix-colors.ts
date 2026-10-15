export type ColorSample = { selector: string; property: string; value: string };

function rgb(value: string): number[] | null {
  if (value === "transparent") return [0, 0, 0, 0];
  const channels = value.match(/^rgba?\(([^()]+)\)$/)?.[1] ?? value;
  const parts = channels.split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3 || parts.length > 4 || parts.some((part) => !/^\d*\.?\d+%?$/.test(part))) return null;
  return parts.map((part, index) => part.endsWith("%") ? parseFloat(part) * (index === 3 ? 0.01 : 2.55) : Number(part));
}

export function findOffTokenColors(samples: ColorSample[], palette: Record<string, string>): ColorSample[] {
  const allowed = Object.values(palette).map(rgb).filter((color): color is number[] => color !== null);
  return samples.filter(({ value }) => {
    if (value === "none" || value === "transparent" || /^url\(/.test(value)) return false;
    // Reject unsupported color spaces even when nested beside a valid RGB color.
    if (/\b(?:oklab|oklch|lab|lch|hsl|hsla|color|color-mix|light-dark)\(/i.test(value)) return true;
    const colors = value.match(/rgba?\([^()]+\)|\btransparent\b/g) ?? [value];
    return colors.some((color) => {
      const parsed = rgb(color);
      return !parsed || (parsed[3] !== 0 && !allowed.some((token) =>
        parsed.slice(0, 3).every((channel, index) => Math.abs(channel - token[index]) <= 1)));
    });
  });
}

/** Serialized by Playwright: keep this function independent of module helpers. */
export function collectColorSamples(cell: Element): ColorSample[] {
  const samples: ColorSample[] = [];
  const selectorOf = (element: Element) => {
    const path: string[] = [];
    for (let node: Element | null = element; node && node !== cell; node = node.parentElement) {
      const siblings = node.parentElement ? Array.from(node.parentElement.children) : [node];
      path.unshift(`${node.localName}:nth-child(${siblings.indexOf(node) + 1})`);
    }
    return `[data-lab-cell="${cell.getAttribute("data-lab-cell")}"]` + (path.length ? ` > ${path.join(" > ")}` : "");
  };
  const shapes = new Set(["path", "circle", "rect", "ellipse", "line", "polyline", "polygon", "text", "tspan", "use"]);
  const nativeControls = new Set(["checkbox", "radio", "range", "color"]);
  for (const element of [cell, ...Array.from(cell.querySelectorAll("*"))]) {
    if (element.closest("[data-brand-icon]")) continue;
    // Gradient stops have no box; their colour is what the url(#…) fill paints.
    if (element.localName === "stop") {
      samples.push({ selector: selectorOf(element), property: "stop-color", value: getComputedStyle(element).getPropertyValue("stop-color") });
      continue;
    }
    const rects = Array.from(element.getClientRects());
    // Skip unrendered boxes and off-screen honeypots (`-left-[9999px]`).
    if (!rects.length || rects.every((rect) => rect.right <= 0 || rect.bottom <= 0)) continue;
    // `sr-only` clips the box to nothing, so none of its colours are painted.
    if (getComputedStyle(element).clip === "rect(0px, 0px, 0px, 0px)") continue;
    for (const pseudo of [null, "::before", "::after"]) {
      const style = getComputedStyle(element, pseudo);
      if (style.visibility === "hidden" || style.visibility === "collapse" || style.display === "none") continue;
      if (pseudo && (style.content === "none" || style.content === "normal")) continue;
      const native = element instanceof HTMLInputElement && nativeControls.has(element.type) && style.appearance !== "none";
      // Native controls paint their own track/box; only accent-color reaches the page.
      const properties = native ? ["color", "accent-color", "box-shadow"] : ["color", "background-color", "background-image", "box-shadow"];
      for (const side of ["top", "right", "bottom", "left"]) {
        if (parseFloat(style.getPropertyValue(`border-${side}-width`)) > 0
          && !["none", "hidden"].includes(style.getPropertyValue(`border-${side}-style`))) properties.push(`border-${side}-color`);
      }
      if (style.outlineStyle !== "none") properties.push("outline-color");
      if (style.textDecorationLine !== "none") properties.push("text-decoration-color");
      // svg/g only pass fill to children; the painting shapes are checked individually.
      if (element instanceof SVGElement && shapes.has(element.localName)) {
        // A path of single straight segments has no fill area, just like <line>.
        const subpaths = element.getAttribute("d")?.match(/[Mm][^Mm]*/g) ?? [];
        const straightPath = element.localName === "path" && subpaths.length > 0 && subpaths.every((part) => {
          const tokens = part.match(/[a-z]|[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi) ?? [];
          return (tokens.length === 5 && /^[hv]$/i.test(tokens[3]))
            || (tokens.length === 6 && /^[l]$/i.test(tokens[3]));
        });
        if (element.localName !== "line" && !straightPath) properties.push("fill");
        properties.push("stroke");
      }
      for (const property of properties) {
        const value = style.getPropertyValue(property);
        if (value && value !== "none") samples.push({ selector: selectorOf(element) + (pseudo ?? ""), property, value });
      }
    }
  }
  return samples;
}
