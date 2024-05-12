import {
    Component,
    Input,
} from '@angular/core';


@Component({
    selector: 'success-rate',
    templateUrl: 'rate.component.html',
    styleUrls: [
        'rate.component.scss',
    ],
})
export class SuccessRateComponent {
    @Input()
    valid: number;

    @Input()
    invalid: number;

    get total(): number {
        return (this.valid ?? 0) + (this.invalid ?? 0);
    }

    get percentValue(): number {
        const total = this.total;

        if (total <= 0) {
            return 0;
        }

        return Math.round(this.valid / total * 100);
    }

    get color(): string {
        if (this.percentValue >= 90) {
            return 'success';
        }

        if (this.percentValue >= 70) {
            return 'warning';
        }

        return 'danger';
    }
}
