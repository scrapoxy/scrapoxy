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
import { ConnectorEvomiComponent } from './connector/connector.component';
import { CredentialEvomiComponent } from './credential/credential.component';
import { ConnectorEvomiFactory } from './evomi.factory';


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
        ConnectorEvomiComponent, CredentialEvomiComponent,
    ],
    providers: [
        ConnectorEvomiFactory,
    ],
})
export class ConnectorEvomiModule {
    constructor(private readonly factory: ConnectorEvomiFactory) {
        this.factory.init();
    }
}
