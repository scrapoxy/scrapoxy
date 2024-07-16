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
import { ConnectorLiveproxiesComponent } from './connector/connector.component';
import { CredentialLiveproxiesComponent } from './credential/credential.component';
import { ConnectorLiveproxiesFactory } from './liveproxies.factory';


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
        ConnectorLiveproxiesComponent, CredentialLiveproxiesComponent,
    ],
    providers: [
        ConnectorLiveproxiesFactory,
    ],
})
export class ConnectorLiveproxiesModule {
    constructor(private readonly factory: ConnectorLiveproxiesFactory) {
        this.factory.init();
    }
}
