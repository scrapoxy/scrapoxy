import { migration as migration0001 } from './0001-init';
import { migration as migration0002 } from './0002-proxidize';
import { migration as migration0003 } from './0003-freeproxies';
import { migration as migration0004 } from './0004-iproyal';
import { migration as migration0005 } from './0005-format';


export default [
    migration0001,
    migration0002,
    migration0003,
    migration0004,
    migration0005,
];
