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
import { ConnectorDigitaloceanComponent } from './connector/connector.component';
import { CredentialDigitaloceanComponent } from './credential/credential.component';
import { ConnectorDigitaloceanFactory } from './digitalocean.factory';


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
        ConnectorDigitaloceanComponent, CredentialDigitaloceanComponent,
    ],
    providers: [
        ConnectorDigitaloceanFactory,
    ],
})
export class ConnectorDigitaloceanModule {
    constructor(private readonly factory: ConnectorDigitaloceanFactory) {
        this.factory.init();
    }
}
