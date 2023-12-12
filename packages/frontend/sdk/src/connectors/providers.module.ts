import { NgModule } from '@angular/core';
import { ConnectorNamePipe } from './providers.pipe';
import { ConnectorprovidersService } from './providers.service';


const DECLARATIONS = [
    ConnectorNamePipe,
];

@NgModule({
    providers: [
        ConnectorprovidersService,
    ],
    declarations: [
        ...DECLARATIONS,
    ],
    exports: [
        ...DECLARATIONS,
    ],
})
export class ConnectorprovidersModule {}
