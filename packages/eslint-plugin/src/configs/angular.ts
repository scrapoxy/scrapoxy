export default {
    plugins: [
        // From ng-cli-compat
        'eslint-plugin-import',
        'eslint-plugin-jsdoc',
        'eslint-plugin-prefer-arrow',

        // From ng-cli-compat--formatting-add-on
        'eslint-plugin-jsdoc',

        // Custom
        '@angular-eslint/eslint-plugin',
        '@angular-eslint/eslint-plugin-template',
        '@typescript-eslint/eslint-plugin',
    ],
    extends: [
        'plugin:@angular-eslint/template/process-inline-templates',
    ],
    rules: {
        // From ng-cli-compat
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/explicit-member-accessibility': 'off',
        'sort-keys': 'off',
        '@angular-eslint/component-class-suffix': 'error',
        '@angular-eslint/contextual-lifecycle': 'error',
        '@angular-eslint/directive-class-suffix': 'error',
        '@angular-eslint/no-conflicting-lifecycle': 'error',
        '@angular-eslint/no-host-metadata-property': 'error',
        '@angular-eslint/no-input-rename': 'error',
        '@angular-eslint/no-inputs-metadata-property': 'error',
        '@angular-eslint/no-output-native': 'error',
        '@angular-eslint/no-output-on-prefix': 'error',
        '@angular-eslint/no-output-rename': 'error',
        '@angular-eslint/no-outputs-metadata-property': 'error',
        '@angular-eslint/use-lifecycle-interface': 'error',
        '@angular-eslint/use-pipe-transform-interface': 'error',
        '@typescript-eslint/adjacent-overload-signatures': 'error',
        '@typescript-eslint/array-type': 'off',
        '@typescript-eslint/ban-types': [
            'error',
            {
                types: {
                    Object: {
                        message: 'Avoid using the `Object` type. Did you mean `object`?',
                    },
                    Function: {
                        message: 'Avoid using the `Function` type. Prefer a specific function type, like `() => void`.',
                    },
                    Boolean: {
                        message: 'Avoid using the `Boolean` type. Did you mean `boolean`?',
                    },
                    Number: {
                        message: 'Avoid using the `Number` type. Did you mean `number`?',
                    },
                    String: {
                        message: 'Avoid using the `String` type. Did you mean `string`?',
                    },
                    Symbol: {
                        message: 'Avoid using the `Symbol` type. Did you mean `symbol`?',
                    },
                },
            },
        ],
        '@typescript-eslint/consistent-type-assertions': 'error',
        '@typescript-eslint/dot-notation': 'error',
        '@typescript-eslint/member-ordering': 'error',
        '@typescript-eslint/naming-convention': 'error',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-empty-interface': 'error',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-inferrable-types': [
            'error',
            {
                ignoreParameters: true,
            },
        ],
        '@typescript-eslint/no-misused-new': 'error',
        '@typescript-eslint/no-namespace': 'error',
        '@typescript-eslint/no-parameter-properties': 'off',
        '@typescript-eslint/no-unused-expressions': 'error',
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/prefer-for-of': 'error',
        '@typescript-eslint/prefer-function-type': 'error',
        '@typescript-eslint/prefer-namespace-keyword': 'error',
        '@typescript-eslint/triple-slash-reference': [
            'error',
            {
                path: 'always',
                types: 'prefer-import',
                lib: 'always',
            },
        ],
        '@typescript-eslint/unified-signatures': 'error',
        complexity: 'off',
        'constructor-super': 'error',
        eqeqeq: [
            'error', 'smart',
        ],
        'guard-for-in': 'error',
        'id-blacklist': [
            'error',
            'any',
            'Number',
            'number',
            'String',
            'string',
            'Boolean',
            'boolean',
            'Undefined',
            'undefined',
        ],
        'id-match': 'error',
        'import/no-deprecated': 'warn',
        'jsdoc/tag-lines': 'error',
        'jsdoc/no-types': 'error',
        'max-classes-per-file': 'off',
        'no-bitwise': 'error',
        'no-caller': 'error',
        'no-cond-assign': 'error',
        'no-console': [
            'error',
            {
                allow: [
                    'log',
                    'warn',
                    'dir',
                    'timeLog',
                    'assert',
                    'clear',
                    'count',
                    'countReset',
                    'group',
                    'groupEnd',
                    'table',
                    'dirxml',
                    'error',
                    'groupCollapsed',
                    'Console',
                    'profile',
                    'profileEnd',
                    'timeStamp',
                    'context',
                ],
            },
        ],
        'no-debugger': 'error',
        'no-empty': 'off',
        'no-eval': 'error',
        'no-fallthrough': 'error',
        'no-invalid-this': 'off',
        'no-new-wrappers': 'error',
        'no-restricted-imports': [
            'error',
            {
                name: 'rxjs/Rx',
                message: 'Please import directly from "rxjs" instead',
            },
        ],
        '@typescript-eslint/no-shadow': [
            'error',
            {
                hoist: 'all',
            },
        ],
        'no-throw-literal': 'error',
        'no-undef-init': 'error',
        'no-underscore-dangle': 'error',
        'no-unsafe-finally': 'error',
        'no-unused-labels': 'error',
        'no-var': 'error',
        'object-shorthand': 'error',
        'one-var': [
            'error', 'never',
        ],
        'prefer-const': 'error',
        radix: 'error',
        'use-isnan': 'error',
        'valid-typeof': 'off',

        // From ng-cli-compat--formatting-add-on
        'arrow-body-style': 'error',
        'arrow-parens': 'off',
        'comma-dangle': 'off',
        curly: 'error',
        'eol-last': 'error',
        'jsdoc/check-alignment': 'error',
        'new-parens': 'error',
        'no-multiple-empty-lines': 'off',
        'no-trailing-spaces': 'error',
        'quote-props': [
            'error', 'as-needed',
        ],
        '@typescript-eslint/member-delimiter-style': [
            'error',
            {
                multiline: {
                    delimiter: 'semi',
                    requireLast: true,
                },
                singleline: {
                    delimiter: 'semi',
                    requireLast: false,
                },
            },
        ],
        quotes: 'off',
        '@typescript-eslint/quotes': [
            'error',
            'single',
            {
                allowTemplateLiterals: true,
            },
        ],
        '@typescript-eslint/semi': [
            'error', 'always',
        ],
        '@typescript-eslint/type-annotation-spacing': 'error',

        // Custom rules
        '@angular-eslint/component-selector': 'off',
        '@angular-eslint/directive-selector': 'off',
        'prefer-arrow/prefer-arrow-functions': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'max-len': [
            'error',
            {
                code: 360,
            },
        ],
        'space-before-function-paren': 'off',
        '@typescript-eslint/space-before-function-paren': [
            'error', 'never',
        ],
    },
};
