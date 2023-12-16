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
import {
    ConnectorprovidersModule,
    FingerprintModule,
} from '@scrapoxy/frontend-sdk';
import { ConnectorIproyalResidentialComponent } from './connector/connector.component';
import { InputLifetimeComponent } from './connector/input-lifetime/input-lifetime.component';
import { CredentialIproyalResidentialComponent } from './credential/credential.component';
import { ConnectorIproyalResidentialFactory } from './iproyal-residential.factory';


@NgModule({
    imports: [
        ButtonModule,
        CommonModule,
        ConnectorprovidersModule,
        FormModule,
        FormsModule,
        GridModule,
        IconModule,
        TableModule,
        TooltipModule,
        ReactiveFormsModule,
        FingerprintModule,
    ],
    declarations: [
        ConnectorIproyalResidentialComponent, CredentialIproyalResidentialComponent, InputLifetimeComponent,
    ],
    providers: [
        ConnectorIproyalResidentialFactory,
    ],
})
export class ConnectorIproyalResidentialModule {
    constructor(private readonly factory: ConnectorIproyalResidentialFactory) {
        this.factory.init();
    }
}
