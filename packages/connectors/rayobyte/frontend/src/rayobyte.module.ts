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
    FingerprintModule,
} from '@scrapoxy/frontend-sdk';
import { ConnectorRayobyteComponent } from './connector/connector.component';
import { CredentialRayobyteComponent } from './credential/credential.component';
import { ConnectorRayobyteFactory } from './rayobyte.factory';


@NgModule({
    imports: [
        ButtonModule,
        ConnectorprovidersModule,
        FormModule,
        FormsModule,
        GridModule,
        IconModule,
        TableModule,
        TooltipModule,
        ReactiveFormsModule,
        FingerprintModule,
    ],
    declarations: [
        ConnectorRayobyteComponent, CredentialRayobyteComponent,
    ],
    providers: [
        ConnectorRayobyteFactory,
    ],
})
export class ConnectorRayobyteModule {
    constructor(private readonly factory: ConnectorRayobyteFactory) {
        this.factory.init();
    }
}
