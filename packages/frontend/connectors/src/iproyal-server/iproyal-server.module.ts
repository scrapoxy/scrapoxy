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
import { ConnectorIproyalServerComponent } from './connector/connector.component';
import { CredentialIproyalServerComponent } from './credential/credential.component';
import { ConnectorIproyalServerFactory } from './iproyal-server.factory';


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
        ConnectorIproyalServerComponent, CredentialIproyalServerComponent,
    ],
    providers: [
        ConnectorIproyalServerFactory,
    ],
})
export class ConnectorIproyalServerModule {
    constructor(private readonly factory: ConnectorIproyalServerFactory) {
        this.factory.init();
    }
}
