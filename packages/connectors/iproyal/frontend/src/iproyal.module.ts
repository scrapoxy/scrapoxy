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
import { ConnectorIproyalComponent } from './connector/connector.component';
import { CredentialIproyalComponent } from './credential/credential.component';
import { ConnectorIproyalFactory } from './iproyal.factory';


@NgModule({
    imports: [
        ButtonModule,
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
        ConnectorIproyalComponent, CredentialIproyalComponent,
    ],
    providers: [
        ConnectorIproyalFactory,
    ],
})
export class ConnectorIproyalModule {
    constructor(private readonly factory: ConnectorIproyalFactory) {
        this.factory.init();
    }
}
