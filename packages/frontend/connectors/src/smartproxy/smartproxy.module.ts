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
import { ConnectorSmartproxyComponent } from './connector/connector.component';
import { CredentialSmartproxyComponent } from './credential/credential.component';
import { ConnectorSmartproxyFactory } from './smartproxy.factory';


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
        ConnectorSmartproxyComponent, CredentialSmartproxyComponent,
    ],
    providers: [
        ConnectorSmartproxyFactory,
    ],
})
export class ConnectorSmartproxyModule {
    constructor(private readonly factory: ConnectorSmartproxyFactory) {
        this.factory.init();
    }
}
