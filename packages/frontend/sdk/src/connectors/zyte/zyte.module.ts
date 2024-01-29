import { NgModule } from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
} from '@angular/forms';
import {
    ButtonModule,
    FormModule,
    GridModule,
    TooltipModule,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { ConnectorZyteComponent } from './connector/connector.component';
import { CredentialZyteComponent } from './credential/credential.component';
import { ConnectorZyteFactory } from './zyte.factory';
import { ConnectorprovidersModule } from '../providers.module';


@NgModule({
    imports: [
        ButtonModule,
        ConnectorprovidersModule,
        FormModule,
        FormsModule,
        GridModule,
        IconModule,
        ReactiveFormsModule,
        TooltipModule,
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
