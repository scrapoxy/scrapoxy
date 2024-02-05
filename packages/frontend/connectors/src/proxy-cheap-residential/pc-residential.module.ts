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
import { ConnectorProxyCheapResidentialComponent } from './connector/connector.component';
import { CredentialProxyCheapResidentialComponent } from './credential/credential.component';
import { ConnectorProxyCheapResidentialFactory } from './pc-residential.factory';


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
        ConnectorProxyCheapResidentialComponent, CredentialProxyCheapResidentialComponent,
    ],
    providers: [
        ConnectorProxyCheapResidentialFactory,
    ],
})
export class ConnectorProxyCheapResidentialModule {
    constructor(private readonly factory: ConnectorProxyCheapResidentialFactory) {
        this.factory.init();
    }
}
