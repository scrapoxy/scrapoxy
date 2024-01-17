import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import {
    provideRouter,
    RouterModule,
} from '@angular/router';
import {
    BreadcrumbModule,
    ButtonGroupModule,
    ButtonModule,
    CardModule,
    FormModule,
    GridModule,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { ConnectorprovidersModule } from '@scrapoxy/frontend-sdk';
import { MarketplaceComponent } from './marketplace.component';
import { routes } from './marketplace.routes';


@NgModule({
    imports: [
        BreadcrumbModule,
        ButtonGroupModule,
        ButtonModule,
        CardModule,
        CommonModule,
        ConnectorprovidersModule,
        FormModule,
        GridModule,
        IconModule,
        RouterModule,
    ],
    declarations: [
        MarketplaceComponent,
    ],
    providers: [
        provideRouter(routes),
    ],
})
export class MarketplaceModule { }
