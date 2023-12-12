import { NgModule } from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
} from '@angular/forms';
import {
    ButtonModule,
    FormModule,
    GridModule,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { ConnectorprovidersModule } from '@scrapoxy/frontend-sdk';
import { ConnectorZyteComponent } from './connector/connector.component';
import { CredentialZyteComponent } from './credential/credential.component';
import { ConnectorZyteFactory } from './zyte.factory';


@NgModule({
    imports: [
        ButtonModule,
        ConnectorprovidersModule,
        FormModule,
        FormsModule,
        GridModule,
        IconModule,
        ReactiveFormsModule,
    ],
    declarations: [
        ConnectorZyteComponent, CredentialZyteComponent,
    ],
    providers: [
        ConnectorZyteFactory,
    ],
})
export class ConnectorZyteModule {
    constructor(private readonly factory: ConnectorZyteFactory) {
        this.factory.init();
    }
}
