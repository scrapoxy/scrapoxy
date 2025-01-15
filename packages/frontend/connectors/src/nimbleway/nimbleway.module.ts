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
import { ConnectorNimblewayComponent } from './connector/connector.component';
import { CredentialNimblewayComponent } from './credential/credential.component';
import { ConnectorNimblewayFactory } from './nimbleway.factory';


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
        ConnectorNimblewayComponent, CredentialNimblewayComponent,
    ],
    providers: [
        ConnectorNimblewayFactory,
    ],
})
export class ConnectorNimblewayModule {
    constructor(private readonly factory: ConnectorNimblewayFactory) {
        this.factory.init();
    }
}
