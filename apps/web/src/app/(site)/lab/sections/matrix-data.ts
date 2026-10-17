export function selectLabIds(query: string | undefined, available: readonly string[]): string[] {
  const selected = [...new Set((query ?? "").split(",").map((id) => id.trim()))]
    .filter((id) => available.includes(id));
  return selected.length ? selected : [...available];
}

type PaletteTheme = {
  meta: { id: string; supportsDark: boolean };
  colors: { light: Record<string, string>; dark?: Partial<Record<string, string>> };
};

export function labPalette(themes: readonly PaletteTheme[]) {
  return Object.fromEntries(themes.map((theme) => [theme.meta.id, {
    supportsDark: theme.meta.supportsDark,
    light: theme.colors.light,
    dark: { ...theme.colors.light, ...theme.colors.dark },
  }]));
}
