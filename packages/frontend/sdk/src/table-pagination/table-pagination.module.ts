import { NgModule } from '@angular/core';
import { PaginationModule } from '@coreui/angular';
import { TablePaginationComponent } from './table-pagination.component';


const DECLARATIONS = [
    TablePaginationComponent,
];


@NgModule({
    imports: [
        PaginationModule,
    ],
    declarations: [
        ...DECLARATIONS,
    ],
    exports: [
        ...DECLARATIONS,
    ],
})
export class TablePaginationModule {}
