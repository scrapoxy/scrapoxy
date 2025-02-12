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
import { ConnectorprovidersModule } from '@scrapoxy/frontend-sdk';
import { ConnectorTencentComponent } from './connector/connector.component';
import { CredentialTencentComponent } from './credential/credential.component';
import { InstallTencentComponent } from './install/install.component';
import { ConnectorTencentFactory } from './tencent.factory';


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
        ConnectorTencentComponent, CredentialTencentComponent, InstallTencentComponent,
    ],
    providers: [
        ConnectorTencentFactory,
    ],
})
export class ConnectorTencentModule {
    constructor(private readonly factory: ConnectorTencentFactory) {
        this.factory.init();
    }
}
