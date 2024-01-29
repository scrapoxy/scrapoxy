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
import { ConnectorIproyalResidentialComponent } from './connector/connector.component';
import { InputLifetimeComponent } from './connector/input-lifetime/input-lifetime.component';
import { CredentialIproyalResidentialComponent } from './credential/credential.component';
import { ConnectorIproyalResidentialFactory } from './iproyal-residential.factory';
import { FingerprintModule } from '../../fingerprint';
import { ConnectorprovidersModule } from '../providers.module';


@NgModule({
    imports: [
        ButtonModule,
        CommonModule,
        ConnectorprovidersModule,
        FingerprintModule,
        FormModule,
        FormsModule,
        GridModule,
        IconModule,
        ReactiveFormsModule,
        TableModule,
        TooltipModule,
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
