# Scrapoxy ESLint Rules

## Build it

```shell
npm run build
```

## Publish it

```shell
cd dist/eslint-plugin
npm publish --access public
```

## Configure your project

Add the file `.eslintrc.js` on the project root:

```js
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
            ],

            parserOptions: {
                project: [
                    './tsconfig.json',
                ],
            },
        },
    ],
};
```

For Angular, you can add :
```js
            ...
            extends: [
                'plugin:@scrapoxy/base',
                'plugin:@scrapoxy/typescript',
                'plugin:@scrapoxy/naming-conventions',
                'plugin:@scrapoxy/angular',
            ],
            ...
```

Add the configuration in the `package.json`:
```json
    ...
    "scripts": {
        "lint": "eslint --fix **/*.ts"
    },
    ...
```
