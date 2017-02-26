function Master(config, manager, stats) {
    let MasterImpl;
    if (config.useMitm) {
        MasterImpl = require('./mitm');
    }
    else {
        MasterImpl = require('./plain');
    }

    return new MasterImpl(config, manager, stats);
}

module.exports = Master;
