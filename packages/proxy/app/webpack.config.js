const {composePlugins, withNx} = require('@nx/webpack');
const TerserPlugin = require('terser-webpack-plugin');
const {relative} = require('path');


module.exports = composePlugins(withNx(), (config) => {
    config.optimization = {
        minimize: true,
        minimizer: [new TerserPlugin()],
    }

    config.output.devtoolModuleFilenameTemplate = (info) => {
        const rel = relative(process.cwd(), info.absoluteResourcePath);
        return `webpack:///./${rel}`
    }

    return config;
});
