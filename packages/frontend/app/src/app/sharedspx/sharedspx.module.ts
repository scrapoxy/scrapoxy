import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
    ButtonGroupModule,
    ButtonModule,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
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
    NumberUnit,
    TimeUnit,
    LoadingButtonComponent,
    InputRangeComponent,
    ProjectStatusComponent,
];


@NgModule({
    imports: [
        ButtonModule,
        ButtonGroupModule,
        CommonModule,
        IconModule,
        RouterModule,
    ],
    declarations: [
        ...DECLARATIONS,
    ],
    exports: [
        ...DECLARATIONS,
    ],
})
export class SharedSpxModule { }
