import {
    Component,
    Input,
} from '@angular/core';


@Component({
    selector: 'widget-range',
    templateUrl: 'range.component.html',
    styleUrls: [
        './range.component.scss',
    ],
})
export class WidgetRangeComponent {
    @Input()
    min: string;

    @Input()
    max: string;

    @Input()
    avg: string;

    @Input()
    label: string;

    @Input()
    color = '';

    get cssClasses(): string {
        if (!this.color ||
            this.color.length <= 0) {
            return '';
        }

        return `bg-${this.color}`;
    }
}
