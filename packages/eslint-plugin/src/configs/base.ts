export default {
    rules: {
        'array-bracket-spacing': [
            'error', 'always',
        ],
        'array-bracket-newline': [
            'error',
            {
                minItems: 1,
            },
        ],
        'array-element-newline': [
            'error',
            {
                minItems: 4,
                multiline: true,
            },
        ],

        'array-type': 'error',
        'no-array-constructor': 'error',

        'arrow-parens': [
            'error', 'always',
        ],

        'brace-style': 'error',

        'comma-dangle': [
            'error', 'always-multiline',
        ],

        'comma-spacing': [
            'error',
            {
                before: false,
                after: true,
            },
        ],

        'computed-property-spacing': [
            'error', 'always',
        ],

        'default-param-last': 'error',

        'dot-notation': 'error',

        'func-call-spacing': [
            'error', 'never',
        ],

        'function-call-argument-newline': [
            'error', 'always',
        ],

        'function-paren-newline': [
            'error',
            {
                minItems: 2,
            },
        ],

        indent: [
            'error',
            4,
            {
                SwitchCase: 1,
            },
        ],

        'key-spacing': [
            'error',
            {
                beforeColon: false,
                afterColon: true,
                mode: 'strict',
            },
        ],
        'keyword-spacing': 'error',

        'linebreak-style': [
            'error', 'unix',
        ],

        'lines-between-class-members': 'error',

        'max-len': [
            'error',
            {
                code: 360,
            },
        ],

        'newline-per-chained-call': [
            'error',
            {
                ignoreChainWithDepth: 1,
            },
        ],

        'no-dupe-class-members': 'error',

        'no-duplicate-imports': 'error',

        'no-extra-parens': 'error',

        'no-extra-semi': 'error',

        'no-invalid-this': 'error',

        'no-loop-func': 'error',

        'no-loss-of-precision': 'error',

        'no-mixed-spaces-and-tabs': 'error',

        'no-multiple-empty-lines': [
            'error',
            {
                max: 2,
                maxBOF: 0,
                maxEOF: 0,
            },
        ],

        'no-multi-spaces': 'error',

        'no-redeclare': 'error',

        'no-shadow': 'error',

        'no-unused-expressions': 'error',

        'no-unused-vars': 'error',

        'no-use-before-define': 'error',

        'no-useless-constructor': 'error',

        'object-curly-newline': [
            'error',
            {
                ObjectExpression: {
                    minProperties: 1,
                },
                ObjectPattern: {
                    minProperties: 4,
                },
                ImportDeclaration: {
                    multiline: true,
                },
                ExportDeclaration: {
                    minProperties: 4,
                },
            },
        ],

        'object-curly-spacing': [
            'error', 'always',
        ],

        'object-property-newline': [
            'error',
            {
                allowAllPropertiesOnSameLine: true,
            },
        ],

        'padding-line-between-statements': [
            'error',
            {
                blankLine: 'always',
                prev: 'import',
                next: '*',
            },
            {
                blankLine: 'always',
                prev: '*',
                next: [
                    'if',
                    'const',
                    'let',
                    'return',
                    'throw',
                    'class',
                    'function',
                    'export',
                ],
            },
            {
                blankLine: 'never',
                prev: 'import',
                next: 'import',
            },
            {
                blankLine: 'never',
                prev: [
                    'const', 'let',
                ],
                next: [
                    'const', 'let',
                ],
            },
        ],

        'quote-props': [
            'error', 'as-needed',
        ],

        quotes: [
            'error', 'single',
        ],

        semi: [
            'error', 'always',
        ],

        'sort-vars': 'error',

        'space-before-blocks': 'error',

        'space-before-function-paren': [
            'error', 'never',
        ],

        'space-in-parens': [
            'error', 'never',
        ],

        'space-infix-ops': 'error',

        'sort-imports': [
            'error',
            {
                ignoreCase: true,
                ignoreDeclarationSort: true,
            },
        ],
    },
};
