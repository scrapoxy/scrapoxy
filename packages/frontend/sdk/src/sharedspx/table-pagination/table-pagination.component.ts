import {
    Component,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';


@Component({
    selector: 'table-pagination',
    templateUrl: 'table-pagination.component.html',
})
export class TablePaginationComponent {
    @Input()
    size = 10;

    @Input()
    pageCurrent: number;

    @Output()
    pageCurrentChange = new EventEmitter<number>();

    @Input()
    get pageMax(): number {
        return this.pageMaxValue;
    }

    set pageMax(value: number) {
        this.pageMaxValue = value;
        this.setPage(this.pageCurrent);
    }

    pagesList: number[] = [];

    private pageMaxValue: number;

    setPage(page: number) {
        if (page < 0 || page >= this.pageMaxValue) {
            return;
        }

        this.pageCurrent = page;

        let pageBoundMin = Math.max(
            0,
            this.pageCurrent - Math.floor(this.size / 2)
        );
        const pageBoundMax = Math.min(
            pageBoundMin + this.size,
            this.pageMaxValue
        );
        const diff = pageBoundMax - pageBoundMin;

        if (diff < this.size) {
            const pageBoundMinNew = pageBoundMin - (this.size - diff);

            if (pageBoundMinNew >= 0) {
                pageBoundMin = pageBoundMinNew;
            }
        }

        this.pagesList.length = 0;
        for (let p = pageBoundMin; p < pageBoundMax; p++) {
            this.pagesList.push(p);
        }

        this.pageCurrentChange.emit(this.pageCurrent);
    }
}
