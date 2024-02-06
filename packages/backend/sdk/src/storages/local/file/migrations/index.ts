import { migration as migration0001 } from './0001-init';
import { migration as migration0002 } from './0002-proxidize';
import { migration as migration0003 } from './0003-freeproxies';
import { migration as migration0004 } from './0004-iproyal';
import { migration as migration0005 } from './0005-format';
import { migration as migration0006 } from './0006-sources';


export default [
    migration0001,
    migration0002,
    migration0003,
    migration0004,
    migration0005,
    migration0006,
];
