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
import { ConnectorRayobyteComponent } from './connector/connector.component';
import { CredentialRayobyteComponent } from './credential/credential.component';
import { ConnectorRayobyteFactory } from './rayobyte.factory';
import { FingerprintModule } from '../../fingerprint';
import { ConnectorprovidersModule } from '../providers.module';


@NgModule({
    imports: [
        ButtonModule,
        ConnectorprovidersModule,
        FingerprintModule,
        FormModule,
        FormsModule,
        GridModule,
        IconModule,
        ReactiveFormsModule,
        TableModule,
        TooltipModule,
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
