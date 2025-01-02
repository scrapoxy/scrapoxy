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
import { ConnectorMassiveComponent } from './connector/connector.component';
import { CredentialMassiveComponent } from './credential/credential.component';
import { ConnectorMassiveFactory } from './massive.factory';


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
        ConnectorMassiveComponent, CredentialMassiveComponent,
    ],
    providers: [
        ConnectorMassiveFactory,
    ],
})
export class ConnectorMassiveModule {
    constructor(private readonly factory: ConnectorMassiveFactory) {
        this.factory.init();
    }
}
