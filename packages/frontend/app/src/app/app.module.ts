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
import {
    ConnectorAwsModule,
    ConnectorAzureModule,
    ConnectorBrightdataModule,
    ConnectorDatacenterLocalModule,
    ConnectorDigitaloceanModule,
    ConnectorFreeproxiesModule,
    ConnectorGcpModule,
    ConnectorGeonodeModule,
    ConnectorHypeproxyModule,
    ConnectorIproyalResidentialModule,
    ConnectorIproyalServerModule,
    ConnectorLiveproxiesModule,
    ConnectorNetnutModule,
    ConnectorNimblewayModule,
    ConnectorNinjasproxyModule,
    ConnectorOvhModule,
    ConnectorProxidizeModule,
    ConnectorProxyCheapResidentialModule,
    ConnectorProxyCheapServerModule,
    ConnectorProxyLocalModule,
    ConnectorProxyrackModule,
    ConnectorProxySellerResidentialModule,
    ConnectorProxySellerServerModule,
    ConnectorRayobyteModule,
    ConnectorScalewayModule,
    ConnectorSmartproxyModule,
    ConnectorXProxyModule,
    ConnectorZyteModule,
} from '@scrapoxy/frontend-connectors';
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
        ConnectorBrightdataModule,
        ConnectorDatacenterLocalModule,
        ConnectorDigitaloceanModule,
        ConnectorFreeproxiesModule,
        ConnectorGcpModule,
        ConnectorGeonodeModule,
        ConnectorHypeproxyModule,
        ConnectorIproyalResidentialModule,
        ConnectorIproyalServerModule,
        ConnectorLiveproxiesModule,
        ConnectorNetnutModule,
        ConnectorNimblewayModule,
        ConnectorNinjasproxyModule,
        ConnectorOvhModule,
        ConnectorProxidizeModule,
        ConnectorProxyCheapResidentialModule,
        ConnectorProxyCheapServerModule,
        ConnectorProxyLocalModule,
        ConnectorProxyrackModule,
        ConnectorProxySellerResidentialModule,
        ConnectorProxySellerServerModule,
        ConnectorRayobyteModule,
        ConnectorScalewayModule,
        ConnectorSmartproxyModule,
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
