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
import { InputDelayComponent } from './input-delay';
import { InputDelayOptionalComponent } from './input-delay-optional';
import { InputDelayRangeComponent } from './input-delay-range';
import { LoadingButtonComponent } from './loading-button';
import { ProjectStatusComponent } from './project-status';
import { TablePaginationComponent } from './table-pagination';
import {
    FileUnit,
    NumberUnit,
    TimeUnit,
} from './unit/unit.pipe';
import { ConnectorprovidersModule } from '../connectors';


const DECLARATIONS = [
    FileUnit,
    FingerprintAddressComponent,
    FingerprintStatusComponent,
    InputDelayComponent,
    InputDelayOptionalComponent,
    InputDelayRangeComponent,
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
        ConnectorprovidersModule,
    ],
    declarations: [
        ...DECLARATIONS,
    ],
    exports: [
        ...DECLARATIONS,
    ],
})
export class SharedSpxModule { }
