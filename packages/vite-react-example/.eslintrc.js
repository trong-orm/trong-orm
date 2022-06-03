const rootDir = process.cwd().includes("packages/vite-react-example")
  ? "./"
  : "./packages/vite-react-example";

module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    "react-app",
    "prettier",
    "eslint:recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:rxjs/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:promise/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: "module",
    tsconfigRootDir: rootDir,
    project: "./tsconfig.json",
  },
  plugins: ["jsx-a11y", "rxjs", "simple-import-sort", "promise"],
  rules: {
    "simple-import-sort/imports": "warn",
    "simple-import-sort/exports": "warn",
  },
};
