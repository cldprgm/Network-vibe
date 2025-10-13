import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [

  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript"],
    // for the test build(don't use it)
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      'react/no-unescaped-entities': 'off',
      '@next/next/no-page-custom-font': 'off',

      "@next/next/no-img-element": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/rules-of-hooks": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "react/display-name": "off",
      "@typescript-eslint/no-require-imports": "off",
      "jsx-a11y/alt-text": "off",

      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/exhaustive-deps": "off",
    },
    // languageOptions: {
    //   parserOptions: {
    //     project: "./tsconfig.json",
    //   },
    // },
  }),
];

export default eslintConfig;