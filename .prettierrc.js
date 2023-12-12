module.exports = {
    trailingComma: 'es5',
    tabWidth: 4,
    semi: true,
    singleQuote: true,
    bracketSpacing: false,
    bracketSameLine: true,
    htmlWhitespaceSensitivity: 'ignore',
    overrides: [
        {
            files: '**/*.html',
            options: {
                printWidth: 120,
            },
        }
    ]
};
