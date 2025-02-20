import { NgModule } from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
} from '@angular/forms';
import {
    ButtonModule,
    FormModule,
    GridModule,
    TooltipModule,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { ConnectorprovidersModule } from '@scrapoxy/frontend-sdk';
import { ConnectorScalewayComponent } from './connector/connector.component';
import { CredentialScalewayComponent } from './credential/credential.component';
import { ConnectorScalewayFactory } from './scaleway.factory';


@NgModule({
    imports: [
        ButtonModule,
        ConnectorprovidersModule,
        FormModule,
        FormsModule,
        GridModule,
        IconModule,
        ReactiveFormsModule,
        TooltipModule,
    ],
    declarations: [
        ConnectorScalewayComponent, CredentialScalewayComponent,
    ],
    providers: [
        ConnectorScalewayFactory,
    ],
})
export class ConnectorScalewayModule {
    constructor(private readonly factory: ConnectorScalewayFactory) {
        this.factory.init();
    }
}
