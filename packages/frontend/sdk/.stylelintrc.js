const
    order = require('../../../stylelint/order.rule'),
    standard = require('../../../stylelint/standard.rule');

module.exports = {
    parserOptions: {
        project: [
            './packages/frontend/sdk/tsconfig.*?.json',
        ],
    },

    plugins: [
        'stylelint-scss', 'stylelint-order',
    ],

    extends: 'stylelint-config-standard',

    rules: {
        ...standard,
        ...order,
    },
};
