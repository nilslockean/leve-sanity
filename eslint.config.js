import js from "@eslint/js";
import studioConfig from "@sanity/eslint-config-studio";

export default [
  // add more generic rule sets here, such as:
  js.configs.recommended,
  ...studioConfig.configs.recommended,
  {
    rules: {
      // override/add rules settings here, such as:
      // "astro/no-set-html-directive": "error"
    },
  },
];
