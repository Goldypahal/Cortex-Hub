import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/", "coverage/", "server/prisma/migrations/"] },
  js.configs.recommended,
  {
    files: ["js/**/*.js"],
    languageOptions: { ecmaVersion: 2023, sourceType: "module", globals: globals.browser }
  },
  {
    files: ["server/**/*.js", "tests/**/*.js", "*.config.js"],
    languageOptions: { ecmaVersion: 2023, sourceType: "module", globals: globals.node }
  },
  {
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" }]
    }
  }
];
