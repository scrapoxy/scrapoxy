import angular from './configs/angular';
import base from './configs/base';
import namingConventions from './configs/naming-conventions';
import typescript from './configs/typescript';
import rules from './rules';


export = {
    rules,
    configs: {
        angular,
        base,
        'naming-conventions': namingConventions,
        typescript,
    },
};
