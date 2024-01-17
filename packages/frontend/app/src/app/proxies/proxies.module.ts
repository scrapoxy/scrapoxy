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
import {
    FingerprintModule,
    TablePaginationModule,
} from '@scrapoxy/frontend-sdk';
import { ProxiesComponent } from './proxies.component';
import { routes } from './proxies.routes';
import { ProxyStatusComponent } from './proxy-status/status.component';
import { SharedSpxModule } from '../sharedspx/sharedspx.module';


@NgModule({
    imports: [
        BadgeModule,
        ButtonModule,
        ButtonGroupModule,
        BreadcrumbModule,
        CardModule,
        CommonModule,
        DropdownModule,
        FingerprintModule,
        GridModule,
        IconModule,
        RouterModule,
        SharedSpxModule,
        TableModule,
        TablePaginationModule,
        TooltipModule,
    ],
    declarations: [
        ProxiesComponent, ProxyStatusComponent,
    ],
    providers: [
        provideRouter(routes),
    ],
})
export class ProxiesModule { }
