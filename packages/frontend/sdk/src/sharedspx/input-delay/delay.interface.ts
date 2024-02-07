export enum ETimeType {
    YEAR = 'year',
    MONTH = 'month',
    DAY = 'day',
    HOUR = 'hour',
    MINUTE = 'min',
    SECOND = 's',
    MS = 'ms',
}

export interface IDelay {
    value: number;
    type: ETimeType;
}
