import { NgModule } from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
} from '@angular/forms';
import {
    ButtonGroupModule,
    ButtonModule,
    FormModule,
    GridModule,
    TooltipModule,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { ConnectorprovidersModule } from '@scrapoxy/frontend-sdk';
import { ConnectorOvhComponent } from './connector/connector.component';
import { CredentialOvhComponent } from './credential/credential.component';
import { ConnectorOvhFactory } from './ovh.factory';


@NgModule({
    imports: [
        ButtonModule,
        ButtonGroupModule,
        ConnectorprovidersModule,
        FormModule,
        FormsModule,
        GridModule,
        IconModule,
        ReactiveFormsModule,
        TooltipModule,
    ],
    declarations: [
        ConnectorOvhComponent, CredentialOvhComponent,
    ],
    providers: [
        ConnectorOvhFactory,
    ],
})
export class ConnectorOvhModule {
    constructor(private readonly factory: ConnectorOvhFactory) {
        this.factory.init();
    }
}
