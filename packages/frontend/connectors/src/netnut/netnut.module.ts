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
import { ConnectorNetnutComponent } from './connector/connector.component';
import { CredentialNetnutComponent } from './credential/credential.component';
import { ConnectorNetnutFactory } from './netnut.factory';


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
        ConnectorNetnutComponent, CredentialNetnutComponent,
    ],
    providers: [
        ConnectorNetnutFactory,
    ],
})
export class ConnectorNetnutModule {
    constructor(private readonly factory: ConnectorNetnutFactory) {
        this.factory.init();
    }
}
