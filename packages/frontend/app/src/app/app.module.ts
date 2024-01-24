import {
    LocationStrategy,
    PathLocationStrategy,
} from '@angular/common';
import {
    HTTP_INTERCEPTORS,
    HttpClientModule,
} from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
    provideRouter,
    RouterModule,
} from '@angular/router';
import { IconModule } from '@coreui/icons-angular';
import { ConnectorAwsModule } from '@scrapoxy/connector-aws-frontend';
import { ConnectorAzureModule } from '@scrapoxy/connector-azure-frontend';
import { ConnectorDatacenterLocalModule } from '@scrapoxy/connector-datacenter-local-frontend';
import { ConnectorDigitaloceanModule } from '@scrapoxy/connector-digitalocean-frontend';
import { ConnectorFreeproxiesModule } from '@scrapoxy/connector-freeproxies-frontend';
import { ConnectorGcpModule } from '@scrapoxy/connector-gcp-frontend';
import { ConnectorIproyalResidentialModule } from '@scrapoxy/connector-iproyal-residential-frontend';
import { ConnectorIproyalServerModule } from '@scrapoxy/connector-iproyal-server-frontend';
import { ConnectorNimblewayModule } from '@scrapoxy/connector-nimbleway-frontend';
import { ConnectorNinjasproxyModule } from '@scrapoxy/connector-ninjasproxy-frontend';
import { ConnectorOvhModule } from '@scrapoxy/connector-ovh-frontend';
import { ConnectorProxidizeModule } from '@scrapoxy/connector-proxidize-frontend';
import { ConnectorProxyCheapResidentialModule } from '@scrapoxy/connector-proxy-cheap-residential-frontend';
import { ConnectorProxyCheapServerModule } from '@scrapoxy/connector-proxy-cheap-server-frontend';
import { ConnectorProxyLocalModule } from '@scrapoxy/connector-proxy-local-frontend';
import { ConnectorProxyrackModule } from '@scrapoxy/connector-proxyrack-frontend';
import { ConnectorRayobyteModule } from '@scrapoxy/connector-rayobyte-frontend';
import { ConnectorXProxyModule } from '@scrapoxy/connector-xproxy-frontend';
import { ConnectorZyteModule } from '@scrapoxy/connector-zyte-frontend';
import {
    ClientRequestsInterceptor,
    CommanderFrontendClientService,
    CommanderUsersClientService,
    ConfirmGuard,
    ConfirmService,
    EventsService,
    ProjectCurrentService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { CallbackComponent } from './callback/callback.component';
import { P404Component } from './error/404.component';
import { LayoutModule } from './layout/layout.module';
import { LoginComponent } from './login/login.component';


@NgModule({
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        CallbackComponent,
        ConnectorAwsModule,
        ConnectorAzureModule,
        ConnectorDatacenterLocalModule,
        ConnectorDigitaloceanModule,
        ConnectorFreeproxiesModule,
        ConnectorGcpModule,
        ConnectorIproyalResidentialModule,
        ConnectorIproyalServerModule,
        ConnectorNimblewayModule,
        ConnectorNinjasproxyModule,
        ConnectorOvhModule,
        ConnectorProxidizeModule,
        ConnectorProxyCheapResidentialModule,
        ConnectorProxyCheapServerModule,
        ConnectorProxyLocalModule,
        ConnectorProxyrackModule,
        ConnectorRayobyteModule,
        ConnectorXProxyModule,
        ConnectorZyteModule,
        HttpClientModule,
        IconModule,
        LayoutModule,
        LoginComponent,
        P404Component,
        RouterModule.forRoot(
            routes,
            {
                useHash: false,
                paramsInheritanceStrategy: 'always',
                scrollPositionRestoration: 'top',
                anchorScrolling: 'enabled',
                initialNavigation: 'enabledBlocking',
            }
        ),
    ],
    declarations: [
        AppComponent,
    ],
    providers: [
        {
            provide: HTTP_INTERCEPTORS,
            useClass: ClientRequestsInterceptor,
            multi: true,
        },
        {
            provide: LocationStrategy,
            useClass: PathLocationStrategy,
        },
        CommanderFrontendClientService,
        CommanderUsersClientService,
        ConfirmGuard,
        ConfirmService,
        EventsService,
        ProjectCurrentService,
        ToastsService,
        provideRouter(routes),
    ],
    bootstrap: [
        AppComponent,
    ],
})
export class AppModule { }
