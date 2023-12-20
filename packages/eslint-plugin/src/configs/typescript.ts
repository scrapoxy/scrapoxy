export default {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 11,
        sourceType: 'module',
    },

    plugins: [
        '@typescript-eslint/eslint-plugin',
        '@nx/eslint-plugin',
        'unused-imports',
        'import',
        '@scrapoxy/eslint-plugin',
    ],

    extends: [
        'plugin:@typescript-eslint/recommended',
    ],

    rules: {
        //////////// STANDARD RULES ////////////

        'array-type': 'off',
        '@typescript-eslint/array-type': 'error',
        'no-array-constructor': 'off',
        '@typescript-eslint/no-array-constructor': 'error',

        '@typescript-eslint/await-thenable': 'error',

        'brace-style': 'off',
        '@typescript-eslint/brace-style': 'error',

        '@typescript-eslint/class-literal-property-style': [
            'error', 'fields',
        ],

        'comma-dangle': 'off',
        '@typescript-eslint/comma-dangle': [
            'error',
            {
                arrays: 'always-multiline',
                objects: 'always-multiline',
                imports: 'always-multiline',
                exports: 'always-multiline',
                functions: 'never',
                enums: 'always-multiline',
                generics: 'never',
                tuples: 'always-multiline',
            },
        ],

        'comma-spacing': 'off',
        '@typescript-eslint/comma-spacing': [
            'error',
            {
                before: false,
                after: true,
            },
        ],

        '@typescript-eslint/consistent-type-assertions': [
            'error',
            {
                assertionStyle: 'as',
                objectLiteralTypeAssertions: 'allow-as-parameter',
            },
        ],

        '@typescript-eslint/consistent-type-imports': 'off',

        'default-param-last': 'off',
        '@typescript-eslint/default-param-last': 'error',

        'dot-notation': 'off',
        '@typescript-eslint/dot-notation': 'error',

        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',

        'func-call-spacing': 'off',
        '@typescript-eslint/func-call-spacing': [
            'error', 'never',
        ],

        indent: 'off',
        '@typescript-eslint/indent': [
            'error',
            4,
            {
                SwitchCase: 1,
                ignoredNodes: [
                    'PropertyDefinition',
                ],
            },
        ],

        '@typescript-eslint/interface-name-prefix': 'off',

        'keyword-spacing': 'off',
        '@typescript-eslint/keyword-spacing': 'error',

        'lines-between-class-members': 'off',
        '@typescript-eslint/lines-between-class-members': 'error',

        '@typescript-eslint/member-delimiter-style': 'error',

        '@typescript-eslint/member-ordering': [
            'error',
            {
                default: [
                    // Index signature
                    'signature',

                    // Static first
                    'public-static-field',
                    'static-field',
                    'public-static-method',
                    'static-method',
                    'protected-static-field',
                    'protected-static-method',
                    'private-static-field',
                    'private-static-method',

                    // Fields
                    'public-abstract-field',
                    'public-decorated-field',
                    'public-instance-field',
                    'public-field',
                    'abstract-field',
                    'decorated-field',
                    'instance-field',
                    'field',

                    'protected-abstract-field',
                    'protected-decorated-field',
                    'protected-instance-field',
                    'protected-field',

                    'private-decorated-field',
                    'private-instance-field',
                    'private-field',

                    // Constructors
                    'public-constructor',
                    'constructor',
                    'protected-constructor',
                    'private-constructor',

                    // Class methods
                    'public-abstract-method',
                    'abstract-method',
                    'public-decorated-method',
                    'decorated-method',
                    'public-instance-method',
                    'instance-method',
                    'public-method',
                    'method',

                    'protected-abstract-method',
                    'protected-decorated-method',
                    'protected-instance-method',
                    'protected-method',

                    'private-decorated-method',
                    'private-instance-method',
                    'private-method',
                ],
            },
        ],

        '@typescript-eslint/method-signature-style': 'error',

        '@typescript-eslint/no-confusing-non-null-assertion': 'error',

        '@typescript-eslint/no-confusing-void-expression': 'error',

        'no-dupe-class-members': 'off',
        '@typescript-eslint/no-dupe-class-members': 'error',

        '@typescript-eslint/no-empty-interface': 'error',

        '@typescript-eslint/no-extra-non-null-assertion': 'error',

        'no-extra-parens': 'off',
        '@typescript-eslint/no-extra-parens': 'error',

        'no-extra-semi': 'off',
        '@typescript-eslint/no-extra-semi': 'error',

        '@typescript-eslint/no-extraneous-class': [
            'error',
            {
                allowWithDecorator: true,
            },
        ],

        '@typescript-eslint/no-floating-promises': 'error',

        '@typescript-eslint/no-for-in-array': 'error',

        '@typescript-eslint/no-implied-eval': 'error',

        '@typescript-eslint/no-inferrable-types': 'error',

        'no-invalid-this': 'off',
        '@typescript-eslint/no-invalid-this': 'error',

        '@typescript-eslint/no-invalid-void-type': 'error',

        'no-loop-func': 'off',
        '@typescript-eslint/no-loop-func': 'error',

        'no-loss-of-precision': 'off',
        '@typescript-eslint/no-loss-of-precision': 'error',

        '@typescript-eslint/no-misused-new': 'error',

        '@typescript-eslint/no-misused-promises': 'error',

        '@typescript-eslint/no-namespace': 'error',

        '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',

        '@typescript-eslint/no-redeclare': 'off',
        'no-redeclare': 'error',

        '@typescript-eslint/no-require-imports': 'error',

        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': 'error',

        '@typescript-eslint/no-this-alias': 'error',

        '@typescript-eslint/no-throw-literal': 'error',

        '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',

        '@typescript-eslint/no-unnecessary-type-arguments': 'error',

        'no-unused-expressions': 'off',
        '@typescript-eslint/no-unused-expressions': 'error',

        'no-use-before-define': 'off',
        '@typescript-eslint/no-use-before-define': 'error',

        'no-useless-constructor': 'off',
        '@typescript-eslint/no-useless-constructor': 'error',


        'object-curly-spacing': 'off',
        '@typescript-eslint/object-curly-spacing': [
            'error', 'always',
        ],

        '@typescript-eslint/prefer-enum-initializers': 'error',

        '@typescript-eslint/prefer-for-of': 'error',

        '@typescript-eslint/prefer-includes': 'error',

        '@typescript-eslint/prefer-literal-enum-member': 'error',

        '@typescript-eslint/prefer-nullish-coalescing': 'error',

        '@typescript-eslint/prefer-optional-chain': 'error',

        '@typescript-eslint/prefer-readonly': 'error',

        '@typescript-eslint/prefer-reduce-type-parameter': 'error',

        '@typescript-eslint/prefer-regexp-exec': 'error',

        '@typescript-eslint/prefer-string-starts-ends-with': 'error',

        quotes: 'off',
        '@typescript-eslint/quotes': [
            'error', 'single',
        ],

        semi: 'off',
        '@typescript-eslint/semi': [
            'error', 'always',
        ],

        'space-before-function-paren': 'off',
        '@typescript-eslint/space-before-function-paren': [
            'error', 'never',
        ],

        'space-infix-ops': 'off',
        '@typescript-eslint/space-infix-ops': 'error',

        '@typescript-eslint/switch-exhaustiveness-check': 'error',

        '@typescript-eslint/type-annotation-spacing': 'error',

        '@typescript-eslint/unified-signatures': 'error',

        //////////// PLUGINS RULES ////////////

        '@nx/enforce-module-boundaries': [
            'error',
        ],

        'no-duplicate-imports': 'off',
        'import/no-duplicates': 'error',

        'import/first': 'error',
        'import/order': [
            'error',
            {
                alphabetize: {
                    order: 'asc',
                    caseInsensitive: true,
                },
                groups: [
                    'builtin',
                    'external',
                    'internal',
                    'index',
                    'sibling',
                    'parent',
                    'type',
                    'object',
                ],
            },
        ],
        'import/no-absolute-path': 'error',
        'import/no-cycle': [
            'error',
            {
                maxDepth: 1,
            },
        ],
        'import/no-useless-path-segments': 'error',

        'import/newline-after-import': [
            'error',
            {
                count: 2,
            },
        ],

        'import/consistent-type-specifier-style': [
            'error', 'prefer-top-level',
        ],

        'unused-imports/no-unused-imports': 'error',

        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'off',

        'unused-imports/no-unused-vars': 'warn',

        '@scrapoxy/import-newline': 'error',
    },
};
