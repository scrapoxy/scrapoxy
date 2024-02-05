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
import { ConnectorNinjasproxyComponent } from './connector/connector.component';
import { CredentialNinjasproxyComponent } from './credential/credential.component';
import { ConnectorNinjasproxyFactory } from './ninjasproxy.factory';


@NgModule({
    imports: [
        ButtonModule,
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
        ConnectorNinjasproxyComponent, CredentialNinjasproxyComponent,
    ],
    providers: [
        ConnectorNinjasproxyFactory,
    ],
})
export class ConnectorNinjasproxyModule {
    constructor(private readonly factory: ConnectorNinjasproxyFactory) {
        this.factory.init();
    }
}
