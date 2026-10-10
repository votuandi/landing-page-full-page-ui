import parser from "@typescript-eslint/parser";
import rule from "./no-hardcoded-style.mjs";

const plugin = { meta: { name: "@solar/eslint-plugin", version: "0.0.0" }, rules: { "no-hardcoded-style": rule } };
export default plugin;
export const tokensConfig = [
  { ignores: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/.test-dist/**", "**/packages/themes/**", "**/brand-icons/**"] },
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
    languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { "@solar": plugin },
    rules: { "@solar/no-hardcoded-style": "error" },
  },
];
