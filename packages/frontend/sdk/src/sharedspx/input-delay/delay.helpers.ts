import {
    ONE_DAY_IN_MS,
    ONE_HOUR_IN_MS,
    ONE_MINUTE_IN_MS,
    ONE_MONTH_IN_MS,
    ONE_SECOND_IN_MS,
    ONE_YEAR_IN_MS,
} from '@scrapoxy/common';
import { ETimeType } from './delay.interface';
import type { IDelay } from './delay.interface';


export function toDelay(value: number | undefined): IDelay | undefined {
    if (!value && value !== 0) {
        return;
    }

    if (value === 0) {
        return {
            value: 0,
            type: ETimeType.MS,
        };
    }

    if (value % ONE_YEAR_IN_MS === 0) {
        return {
            value: value / ONE_YEAR_IN_MS,
            type: ETimeType.YEAR,
        };
    }

    if (value % ONE_MONTH_IN_MS === 0) {
        return {
            value: value / ONE_MONTH_IN_MS,
            type: ETimeType.MONTH,
        };
    }

    if (value % ONE_DAY_IN_MS === 0) {
        return {
            value: value / ONE_DAY_IN_MS,
            type: ETimeType.DAY,
        };
    }

    if (value % ONE_HOUR_IN_MS === 0) {
        return {
            value: value / ONE_HOUR_IN_MS,
            type: ETimeType.HOUR,
        };
    }

    if (value % ONE_MINUTE_IN_MS === 0) {
        return {
            value: value / ONE_MINUTE_IN_MS,
            type: ETimeType.MINUTE,
        };
    }

    if (value % ONE_SECOND_IN_MS === 0) {
        return {
            value: value / ONE_SECOND_IN_MS,
            type: ETimeType.SECOND,
        };
    }

    return {
        value,
        type: ETimeType.MS,
    };
}


export function fromDelay(delay: IDelay | undefined): number | undefined {
    if (!delay) {
        return;
    }

    switch (delay.type) {
        case ETimeType.YEAR: {
            return delay.value * ONE_YEAR_IN_MS;
        }
        case ETimeType.MONTH: {
            return delay.value * ONE_MONTH_IN_MS;
        }
        case ETimeType.DAY: {
            return delay.value * ONE_DAY_IN_MS;
        }
        case ETimeType.HOUR: {
            return delay.value * ONE_HOUR_IN_MS;
        }
        case ETimeType.MINUTE: {
            return delay.value * ONE_MINUTE_IN_MS;
        }
        case ETimeType.SECOND: {
            return delay.value * ONE_SECOND_IN_MS;
        }
        case ETimeType.MS: {
            return delay.value;
        }
    }
}
