import {
    Component,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';
import { ConfirmService } from '@scrapoxy/frontend-sdk';
import type {
    IFreeproxiesToRemoveOptions,
    IFreeproxy,
} from '@scrapoxy/common';


@Component({
    selector: 'freeproxies',
    templateUrl: './freeproxies.component.html',
})
export class FreeproxiesComponent {
    @Input()
    get freeproxies(): IFreeproxy[] {
        return this.value;
    }

    set freeproxies(freeproxies: IFreeproxy[]) {
        this.value = freeproxies;

        this.pageMax = Math.ceil(this.value.length / this.itemsPerPage);

        this.pageCurrent = Math.max(
            0,
            Math.min(
                this.pageCurrent,
                this.pageMax - 1
            )
        );
    }

    @Input()
    itemsPerPage: number;

    @Output() remove = new EventEmitter<IFreeproxiesToRemoveOptions>();

    pageCurrent = 0;

    pageMax = 0;

    private value: IFreeproxy[] = [];

    constructor(private readonly confirmService: ConfirmService) {}

    get view(): IFreeproxy[] {
        const start = this.pageCurrent * this.itemsPerPage;

        return this.value.slice(
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
