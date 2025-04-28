/** @type {import('prettier').Config & import ('prettier-plugin-tailwindcss').PluginOptions & import('@ianvs/prettier-plugin-sort-imports').PrettierConfig} */
export default {
  semi: true,
  tabWidth: 2,
  useTabs: false,
  singleQuote: false,
  trailingComma: "all",
  importOrder: [
    "<TYPES>",
    "",
    "^react",
    "^next",
    "",
    "<THIRD_PARTY_MODULES",
    "",
    "",
    "^~/server/(.*)$",
    "",
    "~/lib/(.*)$",
    "",
    "./(.*)$",
    "../(.*)$",
  ],
  plugins: [
    "@ianvs/prettier-plugin-sort-imports",
    "prettier-plugin-tailwindcss",
  ],
};
