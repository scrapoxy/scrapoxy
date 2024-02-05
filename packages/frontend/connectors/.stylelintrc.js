const
    order = require('../../../../stylelint/order.rule'), // TODO: check path import
    standard = require('../../../stylelint/standard.rule');

module.exports = {
    parserOptions: {
        project: [
            './packages/frontend/connectors/tsconfig.*?.json',
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
