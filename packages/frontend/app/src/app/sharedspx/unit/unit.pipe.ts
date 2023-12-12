import { Pipe } from '@angular/core';
import {
    formatFileUnit,
    formatNumberUnit,
    formatTimeUnit,
} from '@scrapoxy/common';
import type { PipeTransform } from '@angular/core';


@Pipe({
    name: 'numberUnit',
})
export class NumberUnit implements PipeTransform {
    transform(
        val: number | undefined | null, suffix = ''
    ): string {
        if (!val && val !== 0) {
            return '';
        }

        return formatNumberUnit(
            val,
            suffix
        );
    }
}


@Pipe({
    name: 'fileUnit',
})
export class FileUnit implements PipeTransform {
    transform(
        val: number | undefined | null, suffix = ''
    ): string {
        if (!val && val !== 0) {
            return '';
        }

        return formatFileUnit(
            val,
            suffix
        );
    }
}


@Pipe({
    name: 'timeUnit',
})
export class TimeUnit implements PipeTransform {
    transform(val: number | undefined | null): string {
        if (!val && val !== 0) {
            return '';
        }

        return formatTimeUnit(val);
    }
}

