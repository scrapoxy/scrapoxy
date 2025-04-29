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
import { ConnectorDecodoComponent } from './connector/connector.component';
import { CredentialDecodoComponent } from './credential/credential.component';
import { ConnectorDecodoFactory } from './decodo.factory';


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
        ConnectorDecodoComponent, CredentialDecodoComponent,
    ],
    providers: [
        ConnectorDecodoFactory,
    ],
})
export class ConnectorDecodoModule {
    constructor(private readonly factory: ConnectorDecodoFactory) {
        this.factory.init();
    }
}
