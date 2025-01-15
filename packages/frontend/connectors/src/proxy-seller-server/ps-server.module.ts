import { CommonModule } from '@angular/common';
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
import { ConnectorProxySellerServerComponent } from './connector/connector.component';
import { CredentialProxySellerServerComponent } from './credential/credential.component';
import { ConnectorProxySellerServerFactory } from './ps-server.factory';


@NgModule({
    imports: [
        ButtonModule,
        CommonModule,
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
        ConnectorProxySellerServerComponent, CredentialProxySellerServerComponent,
    ],
    providers: [
        ConnectorProxySellerServerFactory,
    ],
})
export class ConnectorProxySellerServerModule {
    constructor(private readonly factory: ConnectorProxySellerServerFactory) {
        this.factory.init();
    }
}
