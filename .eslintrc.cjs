module.exports = {
    root: true,
    extends: [
        'standard',
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:svelte/recommended',
        'plugin:storybook/recommended',
        'prettier',
    ],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2020,
        extraFileExtensions: ['.svelte']
    },
    settings: {

    },

    env: {
        browser: true,
        es2017: true,
        node: true
    },
    overrides: [
        {
            files: ['*.svelte'],
            parser: 'svelte-eslint-parser',
            parserOptions: {
                parser: '@typescript-eslint/parser'
            }
        }
    ],
    rules: {
        'no-void': 'off',
        "svelte/valid-compile": "off",
        '@typescript-eslint/no-unused-vars': [
            'error',
            { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
        ],
        "arrow-spacing": ["error", {
            "before": true,
            "after": true
        }],

        "prefer-const": ["warn"],
        "no-irregular-whitespace": "error",
        "block-spacing": ["error", "always"],
        "no-unused-vars": ["error", {
            "argsIgnorePattern": "^_"
        }],
        "no-self-assign": "warn",
        "brace-style": ["error", "1tbs", {
            "allowSingleLine": true
        }],
        "comma-spacing": ["error", {
            "before": false,
            "after": true
        }],
        "comma-style": ["error", "last"],
        "constructor-super": "error",
        // "curly": ["error", "multi-line"],
        "eqeqeq": ["error", "always", {
            "null": "ignore"
        }],
        "func-call-spacing": ["error", "never"],
        "handle-callback-err": ["error", "^(err|error)$"],
        "key-spacing": ["error", {
            "beforeColon": false,
            "afterColon": true
        }],
        "new-cap": ["error", {
            "newIsCap": true,
            "capIsNew": false
        }],
        "no-invalid-regexp": "error",
        "no-mixed-spaces-and-tabs": "error",
        "comma-dangle": ["error", {
            "arrays": "never",
            "objects": "never",
            "imports": "never",
            "exports": "never",
            "functions": "never"
        }],
        "semi": ['error', 'never'],
        "semi-spacing": ["error", {
            "before": false,
            "after": true
        }],
        "space-before-blocks": ["error", "always"],
        "space-before-function-paren": ["error", "never"],
        "space-in-parens": ["error", "never"],
        "space-infix-ops": "error",
        "space-unary-ops": ["error", {
            "words": true,
            "nonwords": false
        }],
        "spaced-comment": ["error", "always", {
            "line": {
                "markers": ["*package", "!", "/", ",", "="]
            },
            "block": {
                "balanced": true,
                "markers": ["*package", "!", ",", ":", "::", "flow-include"],
                "exceptions": ["*"]
            }
        }],
        "template-curly-spacing": ["error", "never"],
        "template-tag-spacing": ["error", "never"],
        "unicode-bom": ["error", "never"],
        "use-isnan": "error",
        "valid-typeof": ["error", {
            "requireStringLiterals": true
        }],
        "indent": ["error", 4, {
            "SwitchCase": 1
        }]
    }
};
