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
import { ConnectorBrightdataFactory } from './brightdata.factory';
import { ConnectorBrightdataComponent } from './connector/connector.component';
import { CredentialBrightdataComponent } from './credential/credential.component';


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
        ConnectorBrightdataComponent, CredentialBrightdataComponent,
    ],
    providers: [
        ConnectorBrightdataFactory,
    ],
})
export class ConnectorBrightdataModule {
    constructor(private readonly factory: ConnectorBrightdataFactory) {
        this.factory.init();
    }
}
