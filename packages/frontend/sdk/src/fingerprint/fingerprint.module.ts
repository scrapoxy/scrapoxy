import { NgModule } from '@angular/core';
import { TooltipModule } from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { FingerprintAddressComponent } from './address/address.component';
import { FingerprintStatusComponent } from './status/status.component';


const DECLARATIONS = [
    FingerprintAddressComponent, FingerprintStatusComponent,
];


@NgModule({
    imports: [
        IconModule, TooltipModule,
    ],
    declarations: [
        ...DECLARATIONS,
    ],
    exports: [
        ...DECLARATIONS,
    ],
})
export class FingerprintModule {}
