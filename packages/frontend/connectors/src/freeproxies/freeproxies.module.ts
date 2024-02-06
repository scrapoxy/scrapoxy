import { NgModule } from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
} from '@angular/forms';
import {
    ButtonModule,
    FormModule,
    GridModule,
    TableModule,
    TooltipModule,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import {
    ConnectorprovidersModule,
    SharedSpxModule,
} from '@scrapoxy/frontend-sdk';
import { ConnectorFreeproxiesComponent } from './connector/connector.component';
import { FreeproxiesComponent } from './connector/freeproxies/freeproxies.component';
import { FreeproxiesAddComponent } from './connector/freeproxies-add/freeproxies-add.component';
import { SourcesComponent } from './connector/sources/sources.component';
import { SourceAddComponent } from './connector/sources-add/source-add.component';
import { CredentialFreeproxiesComponent } from './credential/credential.component';
import { ConnectorFreeproxiesFactory } from './freeproxies.factory';


@NgModule({
    imports: [
        ButtonModule,
        ConnectorprovidersModule,
        FormModule,
        FormsModule,
        GridModule,
        IconModule,
        ReactiveFormsModule,
        TableModule,
        TooltipModule,
        SharedSpxModule,
    ],
    declarations: [
        ConnectorFreeproxiesComponent,
        CredentialFreeproxiesComponent,
        FreeproxiesComponent,
        FreeproxiesAddComponent,
        SourceAddComponent,
        SourcesComponent,
    ],
    providers: [
        ConnectorFreeproxiesFactory,
    ],
})
export class ConnectorFreeproxiesModule {
    constructor(private readonly factory: ConnectorFreeproxiesFactory) {
        this.factory.init();
    }
}
