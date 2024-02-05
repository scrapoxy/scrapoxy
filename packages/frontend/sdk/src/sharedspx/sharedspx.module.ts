import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
    ButtonGroupModule,
    ButtonModule,
    FormModule,
    PaginationModule,
    TooltipModule,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import {
    FingerprintAddressComponent,
    FingerprintStatusComponent,
} from './fingerprint';
import { InputOptionalNumberComponent } from './input-optional';
import { InputRangeComponent } from './input-range';
import { LoadingButtonComponent } from './loading-button';
import { ProjectStatusComponent } from './project-status';
import { TablePaginationComponent } from './table-pagination';
import {
    FileUnit,
    NumberUnit,
    TimeUnit,
} from './unit/unit.pipe';


const DECLARATIONS = [
    FileUnit,
    FingerprintAddressComponent,
    FingerprintStatusComponent,
    InputOptionalNumberComponent,
    InputRangeComponent,
    LoadingButtonComponent,
    NumberUnit,
    TablePaginationComponent,
    ProjectStatusComponent,
    TablePaginationComponent,
    TimeUnit,
];


@NgModule({
    imports: [
        ButtonGroupModule,
        ButtonModule,
        CommonModule,
        FormModule,
        IconModule,
        PaginationModule,
        RouterModule,
        TooltipModule,
        ReactiveFormsModule,
    ],
    declarations: [
        ...DECLARATIONS,
    ],
    exports: [
        ...DECLARATIONS,
    ],
})
export class SharedSpxModule { }
