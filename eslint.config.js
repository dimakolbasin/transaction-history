import tseslint from "typescript-eslint";

export default [
    ...tseslint.configs.recommended,
    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: "./tsconfig.json",
                tsconfigRootDir: ".",
                paths: {
                    "~/*": ["src/*"],
                    "@/*": ["src/*"]
                },
            },
        },
        rules: {
            semi: ["warn", "always"],
            quotes: ['error', 'single'],
            "no-multiple-empty-lines": ["error", {
                "max": 1,
                "maxBOF": 0,
                "maxEOF": 0
            }]
        },
    },
];