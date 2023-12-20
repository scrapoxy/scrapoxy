export default {
    plugins: [
        '@typescript-eslint',
    ],
    rules: {
        '@typescript-eslint/naming-convention': [
            'error',
            {
                selector: [
                    'function',
                ],
                format: [
                    'camelCase', 'PascalCase',
                ],
            },
            {
                selector: [
                    'classProperty',
                ],
                format: [
                    'camelCase', 'PascalCase',
                ],
            },
            {
                selector: [
                    'classProperty',
                    'typeProperty',
                    'variableLike',
                    'parameterProperty',
                    'accessor',
                    'method',
                ],
                format: [
                    'camelCase',
                ],
            },
            {
                selector: [
                    'enumMember',
                ],
                format: [
                    'PascalCase',
                ],
            },
            {
                selector: 'variable',
                modifiers: [
                    'const',
                ],
                format: [
                    'UPPER_CASE', 'camelCase', 'PascalCase',
                ],
            },
            {
                selector: [
                    'interface',
                ],
                format: [
                    'PascalCase',
                ],
                prefix: [
                    'I',
                ],
            },
            {
                selector: [
                    'class',
                ],
                modifiers: [
                    'abstract',
                ],
                format: [
                    'PascalCase',
                ],
                prefix: [
                    'A',
                ],
            },
            {
                selector: [
                    'typeLike',
                ],
                format: [
                    'PascalCase',
                ],
            },
            {
                selector: 'memberLike',
                modifiers: [
                    'private',
                ],
                format: [
                    'camelCase',
                ],
                leadingUnderscore: 'forbid',
            },
        ],
    },
};
