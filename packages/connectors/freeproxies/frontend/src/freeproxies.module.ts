import { NgModule } from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
} from '@angular/forms';
import {
    ButtonModule,
    FormModule,
    GridModule,
    PaginationModule,
    TableModule,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import {
    ConnectorprovidersModule,
    FingerprintModule,
} from '@scrapoxy/frontend-sdk';
import { ConnectorFreeproxiesComponent } from './connector/connector.component';
import { CredentialFreeproxiesComponent } from './credential/credential.component';
import { ConnectorFreeproxiesFactory } from './freeproxies.factory';


@NgModule({
    imports: [
        ButtonModule,
        ConnectorprovidersModule,
        FormModule,
        FormsModule,
        GridModule,
        IconModule,
        PaginationModule,
        TableModule,
        ReactiveFormsModule,
        FingerprintModule,
    ],
    declarations: [
        ConnectorFreeproxiesComponent, CredentialFreeproxiesComponent,
    ],
    providers: [
        ConnectorFreeproxiesFactory,
    ],
})
export class ConnectorFreeproxiesModule {
    constructor(private readonly factory: ConnectorFreeproxiesFactory) {
        this.factory.init();
    }
}
