module.exports = {
    parserOptions: {
        project: [
            './packages/frontend/sdk/tsconfig.*?.json',
        ],
    },

    extends: '@scrapoxy/stylelint-config',
};
