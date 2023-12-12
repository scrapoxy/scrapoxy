module.exports = {
    'packages/**/*.{ts,scss,html}': files => {
        return `nx affected --target=lint --files=${files.join(',')}`;
    },
};
