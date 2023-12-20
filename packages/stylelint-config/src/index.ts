import rules from './rules';


export = {
    plugins: [
        'stylelint-prettier', 'stylelint-order',
    ],

    extends: 'stylelint-config-standard-scss',

    rules,
};
