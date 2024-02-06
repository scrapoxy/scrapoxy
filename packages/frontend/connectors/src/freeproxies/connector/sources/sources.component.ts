import {
    Component,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';
import { ConfirmService } from '@scrapoxy/frontend-sdk';
import type {
    ISource,
    ISourcesToRemoveOptions,
} from '@scrapoxy/common';


@Component({
    selector: 'sources',
    templateUrl: './sources.component.html',
})
export class SourcesComponent {
    @Input()
    get sources(): ISource[] {
        return this.value;
    }

    set sources(sources: ISource[]) {
        this.value = sources;
    }

    @Output() remove = new EventEmitter<ISourcesToRemoveOptions>();

    private value: ISource[] = [];

    constructor(private readonly confirmService: ConfirmService) {}

    async removeWithConfirm(source: ISource): Promise<void> {
        const accept = await this
            .confirmService.confirm(
                'Remove source',
                `Do you want to remove source ${source.url}?`
            );

        if (!accept) {
            return;
        }

        this.remove.emit({
            urls: [
                source.url,
            ],
        });
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

        this.remove.emit({
            urls: [],
        });
    }
}
