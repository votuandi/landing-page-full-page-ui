import config from "@solar/config/eslint";
export default [...config, { languageOptions: { globals: { console: "readonly", process: "readonly", URL: "readonly" } } }];
