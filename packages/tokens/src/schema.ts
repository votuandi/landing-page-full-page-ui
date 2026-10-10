import { z } from "zod";

import { COLOR_KEYS, GLASS_COLOR_KEYS } from "./color-keys";
export { COLOR_KEYS, GLASS_COLOR_KEYS } from "./color-keys";
export type ColorKey = typeof COLOR_KEYS[number];

export const RgbChannels = z.string().refine(
  (value) => /^\d{1,3} \d{1,3} \d{1,3}$/.test(value)
    && value.split(" ").every((channel) => Number(channel) <= 255),
  'phải có dạng "R G B" (0–255), vd. "21 128 61"',
);

export const RgbaColor = z.string().refine((value) => {
  const match = /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d+(?:\.\d+)?|\.\d+)\s*\)$/.exec(value);
  return match !== null
    && match.slice(1, 4).every((channel) => Number(channel) <= 255)
    && Number(match[4]) <= 1;
}, "phải có dạng rgba(R,G,B,A), vd. rgba(255,255,255,0.78)");

export const ColorSetSchema = z.strictObject({
  ...Object.fromEntries(COLOR_KEYS.map((key) => [key, RgbChannels])) as {
    [Key in ColorKey]: typeof RgbChannels;
  },
  ...Object.fromEntries(GLASS_COLOR_KEYS.map((key) => [key, RgbaColor])) as {
    [Key in typeof GLASS_COLOR_KEYS[number]]: typeof RgbaColor;
  },
});
export type ColorSet = z.infer<typeof ColorSetSchema>;

const nonEmptyString = z.string().min(1, "không được để trống");
const cssLength = z.string().regex(/^\d+(\.\d+)?(px|rem)$/, "phải là độ dài CSS theo px hoặc rem, vd. 28px");
const duration = z.number().int().min(0).max(5000);

export const ThemeTokensSchema = z.strictObject({
  colors: z.strictObject({
    light: ColorSetSchema,
    dark: ColorSetSchema.partial().optional(),
  }),
  font: z.strictObject({
    sans: nonEmptyString,
    display: nonEmptyString,
    weights: z.array(z.number().int().min(100).max(900).multipleOf(100))
      .min(1, "cần ít nhất một độ đậm font")
      .refine((weights) => new Set(weights).size === weights.length, "độ đậm font không được trùng"),
    source: z.enum(["google", "local"]),
  }),
  radius: z.strictObject({
    card: cssLength,
    pill: cssLength,
    media: cssLength,
    input: cssLength,
    button: cssLength,
  }),
  shadow: z.strictObject({
    strength: z.number().min(0).max(1),
    tint: z.enum(COLOR_KEYS),
  }),
  glass: z.strictObject({
    blur: z.number().int().min(0).max(64),
    enabled: z.boolean(),
  }),
  motion: z.strictObject({
    durationFast: duration,
    durationBase: duration,
    durationSlow: duration,
    easing: nonEmptyString,
    revealDistance: z.number().min(0).max(200),
    revealEnabled: z.boolean(),
  }),
  density: z.strictObject({
    sectionY: z.enum(["sm", "md", "lg"]),
    container: z.number().int().min(640).max(1920),
  }),
  meta: z.strictObject({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "chỉ dùng chữ thường, số và dấu gạch nối giữa các nhóm"),
    name: nonEmptyString,
    group: z.enum(["classic", "pro", "signature"]),
    supportsDark: z.boolean(),
    preview: nonEmptyString.optional(),
  }),
}).superRefine((theme, ctx) => {
  if (theme.meta.supportsDark && theme.colors.dark === undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["colors", "dark"],
      message: "cần có bộ màu dark khi supportsDark là true",
    });
  } else if (!theme.meta.supportsDark && theme.colors.dark !== undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["meta", "supportsDark"],
      message: "phải là true khi có bộ màu dark",
    });
  }
});

export type ThemeTokens = z.infer<typeof ThemeTokensSchema>;

export class ThemeParseError extends Error {
  readonly issues: { path: string; message: string }[];

  constructor(input: unknown, error: z.ZodError) {
    const meta = typeof input === "object" && input !== null && "meta" in input ? input.meta : undefined;
    const id = typeof meta === "object" && meta !== null && "id" in meta && typeof meta.id === "string"
      ? meta.id : "?";
    const issues = error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.code === "unrecognized_keys"
        ? `trường không được hỗ trợ: ${issue.keys.join(", ")}` : issue.message,
    }));
    super(`Theme "${id}" không hợp lệ:\n${issues.map((issue) => `- ${issue.path}: ${issue.message}`).join("\n")}`);
    this.name = "ThemeParseError";
    this.issues = issues;
  }
}

export function parseTheme(input: unknown): ThemeTokens {
  const result = safeParseTheme(input);
  if (!result.ok) throw result.error;
  return result.theme;
}

export function safeParseTheme(input: unknown):
  | { ok: true; theme: ThemeTokens }
  | { ok: false; error: ThemeParseError } {
  const result = ThemeTokensSchema.safeParse(input, {
    error: (issue) => issue.code === "invalid_type" && issue.input === undefined
      ? "thiếu trường bắt buộc" : undefined,
  });
  return result.success
    ? { ok: true, theme: result.data }
    : { ok: false, error: new ThemeParseError(input, result.error) };
}
