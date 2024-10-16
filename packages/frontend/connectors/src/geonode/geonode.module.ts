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
import { ConnectorprovidersModule } from '@scrapoxy/frontend-sdk';
import { ConnectorGeonodeComponent } from './connector/connector.component';
import { CredentialGeonodeComponent } from './credential/credential.component';
import { ConnectorGeonodeFactory } from './geonode.factory';


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
    ],
    declarations: [
        ConnectorGeonodeComponent, CredentialGeonodeComponent,
    ],
    providers: [
        ConnectorGeonodeFactory,
    ],
})
export class ConnectorGeonodeModule {
    constructor(private readonly factory: ConnectorGeonodeFactory) {
        this.factory.init();
    }
}
