# Scrapoxy Stylelint Rules

## Build it

```shell
npm run build
```

## Publish it

```shell
cd dist/stylelint-config
npm publish --access public
```

## Configure your project

Add the file `.stylelintrc.js` on the project root:

```js
module.exports = {
    root: true,

    extends: '@scrapoxy/stylelint-config',
};
```
