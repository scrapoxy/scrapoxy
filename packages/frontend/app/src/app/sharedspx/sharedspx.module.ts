import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
    ButtonGroupModule,
    ButtonModule,
    FormModule,
    TooltipModule,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { InputOptionalNumberComponent } from './input-optional/input-optional-number.component';
import { InputRangeComponent } from './input-range/input-range.component';
import { LoadingButtonComponent } from './loading-button/button.component';
import { ProjectStatusComponent } from './project-status/project-status.component';
import {
    FileUnit,
    NumberUnit,
    TimeUnit,
} from './unit/unit.pipe';


const DECLARATIONS = [
    FileUnit,
    InputOptionalNumberComponent,
    InputRangeComponent,
    LoadingButtonComponent,
    NumberUnit,
    ProjectStatusComponent,
    TimeUnit,
];


@NgModule({
    imports: [
        ButtonGroupModule,
        ButtonModule,
        CommonModule,
        FormModule,
        IconModule,
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
