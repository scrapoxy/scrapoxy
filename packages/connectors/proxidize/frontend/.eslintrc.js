module.exports = {
    root: true,

    overrides: [
        {
            files: [
                '*.ts',
            ],

            extends: [
                'plugin:@scrapoxy/base',
                'plugin:@scrapoxy/typescript',
                'plugin:@scrapoxy/naming-conventions',
                'plugin:@scrapoxy/angular',
            ],

            parserOptions: {
                project: [
                    './tsconfig.*?.json',
                ],
            },
        },
    ],
};
