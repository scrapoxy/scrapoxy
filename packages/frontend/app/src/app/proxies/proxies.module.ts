import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import {
    provideRouter,
    RouterModule,
} from '@angular/router';
import {
    BadgeModule,
    BreadcrumbModule,
    ButtonGroupModule,
    ButtonModule,
    CardModule,
    DropdownModule,
    GridModule,
    TableModule,
    TooltipModule,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { SharedSpxModule } from '@scrapoxy/frontend-sdk';
import { ProxiesComponent } from './proxies.component';
import { routes } from './proxies.routes';
import { ProxyStatusComponent } from './proxy-status/status.component';
import { SuccessRateComponent } from './success-rate/rate.component';


@NgModule({
    imports: [
        BadgeModule,
        ButtonModule,
        ButtonGroupModule,
        BreadcrumbModule,
        CardModule,
        CommonModule,
        DropdownModule,
        GridModule,
        IconModule,
        RouterModule,
        SharedSpxModule,
        TableModule,
        TooltipModule,
    ],
    declarations: [
        ProxiesComponent, ProxyStatusComponent, SuccessRateComponent,
    ],
    providers: [
        provideRouter(routes),
    ],
})
export class ProxiesModule { }
