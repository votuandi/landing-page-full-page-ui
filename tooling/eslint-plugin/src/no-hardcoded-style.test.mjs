import { RuleTester } from "eslint";
import parser from "@typescript-eslint/parser";
import rule from "./no-hardcoded-style.mjs";

const tester = new RuleTester({ languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } } });
tester.run("no-hardcoded-style", rule, {
  valid: [
    '/* token-exempt: logo\n*/ const x = "#fff";',
    'const x = import("bg-white");',
    '<a href={"#bead"} id={`#fff`} />',
    '"use client"; import x from "bg-white"; export { x } from "bg-white";',
    '<a href="#bead" id="#fff" className="bg-primary rounded-card" />',
    'const style = { color: "rgb(var(--c-primary) / .2)" };',
    '// token-exempt: logo thương hiệu\nconst x = "#fff";',
    'const x = "#fff"; // token-exempt: logo thương hiệu',
    '/* token-exempt: logo thương hiệu */\nconst x = "#fff";',
    '<div>{/* token-exempt: logo thương hiệu */}\n<span fill="#fff" /></div>',
    { filename: '/repo/packages/themes/t15/theme.ts', code: 'const x = "#fff";' },
    { filename: 'D:\\repo\\packages\\themes\\t15\\theme.ts', code: 'const x = "#fff";' },
    { filename: '/repo/packages/ui/src/brand-icons/zalo.tsx', code: '<svg fill="#fff" />' },
  ],
  invalid: [
    { code: '<div className="bg-[#0E7C3A]" />', errors: [{ message: /bg-primary/ }] },
    ...[
      'const x = cn("bg-white", "rounded-[28px]");',
      'const x = `text-[11px] ${active ? "bg-white" : "bg-primary"}`;',
    ].map((code) => ({ code, errors: 2 })),
    ...[
      'const x = `bg-[${value}]`;',
      'const x = { color: "#fff" };',
      '<svg fill="#fff" />',
      '<svg stroke="rgba(1,2,3,.4)" />',
      '// token-exempt: \nconst x = "#fff";',
      '/* token-exempt: */\nconst x = "#fff";',
      'const fake = "token-exempt: reason"; const x = "#fff";',
      '// token-exempt: reason\n\nconst x = "#fff";',
      'const classes = { active: "text-slate-500" };',
    ].map((code) => ({ code, errors: 1 })),
  ],
});
