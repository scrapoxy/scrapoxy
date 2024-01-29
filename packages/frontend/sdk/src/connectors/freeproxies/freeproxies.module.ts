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
import { ConnectorFreeproxiesComponent } from './connector/connector.component';
import { CredentialFreeproxiesComponent } from './credential/credential.component';
import { ConnectorFreeproxiesFactory } from './freeproxies.factory';
import { FingerprintModule } from '../../fingerprint';
import { TablePaginationModule } from '../../table-pagination';
import { ConnectorprovidersModule } from '../providers.module';


@NgModule({
    imports: [
        ButtonModule,
        ConnectorprovidersModule,
        FingerprintModule,
        FormModule,
        FormsModule,
        GridModule,
        IconModule,
        ReactiveFormsModule,
        TableModule,
        TablePaginationModule,
        TooltipModule,
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
