import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // ========================
  // Global ignores
  // ========================
  {
    ignores: [
      ".expo/**",
      "dist/**",
      "node_modules/**",
      "assets/**",
      "src/app-example/**",
      "eslint.config.js",
    ],
  },

  // ========================
  // Base: ESLint recommended
  // ========================
  js.configs.recommended,

  // ========================
  // TypeScript: strict + stylistic type-checked
  // ========================
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // ========================
  // Shared language options
  // ========================
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  // ========================
  // React recommended
  // ========================
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  {
    settings: {
      react: {
        version: "19.0",
      },
    },
  },

  // ========================
  // React Hooks + custom React rules
  // ========================
  {
    files: ["**/*.{tsx,ts}"],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // --- React strict ---
      "react/function-component-definition": [
        "error",
        {
          namedComponents: "function-declaration",
          unnamedComponents: "arrow-function",
        },
      ],
      "react/hook-use-state": "error",
      "react/jsx-no-leaked-render": "error",
      "react/jsx-no-useless-fragment": "error",
      "react/no-array-index-key": "error",
      "react/no-object-type-as-default-prop": "error",
      "react/no-unstable-nested-components": ["error", { allowAsProps: true }],
      "react/jsx-handler-names": [
        "error",
        {
          eventHandlerPrefix: "on",
          eventHandlerPropPrefix: "on",
        },
      ],
      // Allow async event handlers (common in RN)
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: { attributes: false },
        },
      ],
    },
  },

  // ========================
  // Allow require() for native module / asset imports
  // ========================
  {
    files: [
      "**/app-tabs.tsx",
      "**/app-tabs.web.tsx",
      "**/animated-icon.tsx",
      "**/animated-icon.web.tsx",
      "**/web-badge.tsx",
      "**/explore.tsx",
      "**/(tabs)/index.tsx",
      "**/(tabs)/course.tsx",
      "**/login.tsx",
      "**/_layout.tsx",
      "**/*.native.ts",
      "**/*.native.tsx",
    ],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
    },
  },

  // ========================
  // Relax rules for HTTP service layer (external API calls are inherently dynamic)
  // ========================
  {
    files: ["**/service/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/use-unknown-in-catch-callback-variable": "off",
    },
  },

  // ========================
  // Global strict rules
  // ========================
  {
    rules: {
      // --- General ---
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-alert": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-throw-literal": "off", // TS handles this
      "no-unused-vars": "off", // TS handles this
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": ["error", "always"],
      "prefer-template": "error",
      "prefer-arrow-callback": "error",
      "prefer-rest-params": "error",
      "prefer-spread": "error",

      // --- TypeScript strict ---
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports",
        },
      ],
      "@typescript-eslint/consistent-type-exports": [
        "error",
        {
          fixMixedExportsWithInlineTypeSpecifier: true,
        },
      ],
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/array-type": ["error", { default: "array-simple" }],
      "@typescript-eslint/consistent-generic-constructors": [
        "error",
        "constructor",
      ],
      "@typescript-eslint/consistent-indexed-object-style": ["error", "record"],
      "@typescript-eslint/method-signature-style": ["error", "property"],
      "@typescript-eslint/no-confusing-void-expression": [
        "error",
        {
          ignoreArrowShorthand: true,
        },
      ],
      "@typescript-eslint/no-duplicate-enum-values": "error",
      "@typescript-eslint/no-dynamic-delete": "error",
      "@typescript-eslint/no-inferrable-types": [
        "error",
        {
          ignoreParameters: false,
          ignoreProperties: false,
        },
      ],
      "@typescript-eslint/no-unnecessary-boolean-literal-compare": "error",
      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/no-unnecessary-type-arguments": "error",
      "@typescript-eslint/prefer-for-of": "error",
      "@typescript-eslint/prefer-function-type": "error",
      "@typescript-eslint/prefer-includes": "error",
      "@typescript-eslint/prefer-reduce-type-parameter": "error",
      "@typescript-eslint/prefer-string-starts-ends-with": "error",
      "@typescript-eslint/promise-function-async": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/only-throw-error": "error",
    },
  },
);
