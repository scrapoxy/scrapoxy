import {
    Component,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';
import { ConfirmService } from '@scrapoxy/frontend-sdk';
import type {
    OnDestroy,
    OnInit,
} from '@angular/core';
import type { ISource } from '@scrapoxy/common';
import type {
    Observable,
    Subscription,
} from 'rxjs';


@Component({
    selector: 'sources',
    templateUrl: './sources.component.html',
})
export class SourcesComponent implements OnInit, OnDestroy {
    @Input()
    sources$: Observable<ISource[]>;

    @Output()
    remove = new EventEmitter<string[]>();

    sources: ISource[] = [];

    private subscription: Subscription;

    constructor(private readonly confirmService: ConfirmService) {}

    ngOnInit() {
        this.subscription = this.sources$.subscribe((sources) => {
            this.sources = sources;
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    async removeWithConfirm(source: ISource): Promise<void> {
        const accept = await this
            .confirmService.confirm(
                'Remove source',
                `Do you want to remove source ${source.url}?`
            );

        if (!accept) {
            return;
        }

        this.remove.emit([
            source.id,
        ]);
    }

    async removeAllWithConfirm(): Promise<void> {
        const accept = await this
            .confirmService.confirm(
                'Remove all sources',
                `Do you want to all sources?`
            );

        if (!accept) {
            return;
        }

        this.remove.emit([]);
    }
}
