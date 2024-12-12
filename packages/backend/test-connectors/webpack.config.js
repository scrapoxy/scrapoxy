const {composePlugins, withNx} = require('@nx/webpack');
const {relative} = require('path');


module.exports = composePlugins(withNx(), (config) => {
    config.output.devtoolModuleFilenameTemplate = (info) => {
        const rel = relative(process.cwd(), info.absoluteResourcePath);
        return `webpack:///./${rel}`
    }

    return config;
});
