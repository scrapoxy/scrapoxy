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
import { ConnectorNimblewayComponent } from './connector/connector.component';
import { CredentialNimblewayComponent } from './credential/credential.component';
import { ConnectorNimblewayFactory } from './nimbleway.factory';


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
        ConnectorNimblewayComponent, CredentialNimblewayComponent,
    ],
    providers: [
        ConnectorNimblewayFactory,
    ],
})
export class ConnectorNimblewayModule {
    constructor(private readonly factory: ConnectorNimblewayFactory) {
        this.factory.init();
    }
}
