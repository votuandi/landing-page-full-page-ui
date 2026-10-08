// ESLint 8's JS/FlatCompat packages ship no declarations. Describe the APIs used here
// so checkJs can validate our configuration without changing the approved stack.
declare module "@eslint/js" {
  type RuleValue = string | number | readonly unknown[];
  interface RuleConfig {
    rules: Record<string, RuleValue>;
  }
  const js: { configs: { recommended: RuleConfig; all: RuleConfig } };
  export default js;
}

declare module "@eslint/eslintrc" {
  export class FlatCompat {
    constructor(options: {
      baseDirectory: string;
      resolvePluginsRelativeTo: string;
      recommendedConfig: { rules: Record<string, unknown> };
      allConfig: { rules: Record<string, unknown> };
    });
    extends(...configs: string[]): Record<string, unknown>[];
  }
}
