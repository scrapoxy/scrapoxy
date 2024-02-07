import {
    Component,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';
import { ConfirmService } from '@scrapoxy/frontend-sdk';
import { Observable } from 'rxjs';
import type {
    OnDestroy,
    OnInit,
} from '@angular/core';
import type {
    IFreeproxiesToRemoveOptions,
    IFreeproxy,
} from '@scrapoxy/common';
import type { Subscription } from 'rxjs';


@Component({
    selector: 'freeproxies',
    templateUrl: './freeproxies.component.html',
    styleUrls: [
        './freeproxies.component.scss',
    ],
})
export class FreeproxiesComponent implements OnInit, OnDestroy {
    @Input()
    freeproxies$: Observable<IFreeproxy[]>;

    @Input()
    itemsPerPage: number;

    @Output()
    remove = new EventEmitter<IFreeproxiesToRemoveOptions>();

    freeproxies: IFreeproxy[] = [];

    pageCurrent = 0;

    pageMax = 0;

    private subscription: Subscription;

    constructor(private readonly confirmService: ConfirmService) {}

    ngOnInit() {
        this.subscription = this.freeproxies$.subscribe((freeproxies) => {
            this.freeproxies = freeproxies;

            this.pageMax = Math.ceil(this.freeproxies.length / this.itemsPerPage);

            this.pageCurrent = Math.max(
                0,
                Math.min(
                    this.pageCurrent,
                    this.pageMax - 1
                )
            );
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    get view(): IFreeproxy[] {
        const start = this.pageCurrent * this.itemsPerPage;

        return this.freeproxies.slice(
            start,
            start + this.itemsPerPage
        );
    }

    async removeWithConfirm(freeproxy: IFreeproxy): Promise<void> {
        const accept = await this
            .confirmService.confirm(
                'Remove freeproxy',
                `Do you want to remove freeproxy ${freeproxy.key}?`
            );

        if (!accept) {
            return;
        }

        this.remove.emit({
            ids: [
                freeproxy.id,
            ],
            duplicate: false,
            onlyOffline: false,
        });
    }

    async removeOfflineWithConfirm(): Promise<void> {
        const accept = await this
            .confirmService.confirm(
                'Remove offline freeproxies',
                `Do you want to all offline freeproxies now?`
            );

        if (!accept) {
            return;
        }

        this.remove.emit({
            ids: [],
            duplicate: false,
            onlyOffline: true,
        });
    }

    async removeDuplicateWithConfirm(): Promise<void> {
        const accept = await this
            .confirmService.confirm(
                'Remove duplicate',
                `Do you want to remove all duplicate outbound IP addresses now?`
            );

        if (!accept) {
            return;
        }

        this.remove.emit({
            ids: [],
            duplicate: true,
            onlyOffline: false,
        });
    }

    async removeAllWithConfirm(): Promise<void> {
        const accept = await this
            .confirmService.confirm(
                'Remove all freeproxies',
                `Do you want to all freeproxies?`
            );

        if (!accept) {
            return;
        }

        this.remove.emit({
            ids: [],
            duplicate: false,
            onlyOffline: false,
        });
    }
}
