const {composePlugins, withNx} = require('@nx/webpack');
const TerserPlugin = require('terser-webpack-plugin');


module.exports = composePlugins(withNx(), (config) => {
    config.optimization = {
        minimize: true,
        minimizer: [new TerserPlugin()],
    }
    return config;
});
