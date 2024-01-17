import { NgModule } from '@angular/core';
import {
    provideRouter,
    RouterModule,
} from '@angular/router';
import {
    BreadcrumbModule,
    ButtonModule,
    GridModule,
    TableModule,
    TooltipModule,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { MapComponent } from './map.component';
import { routes } from './map.routes';
import { SharedSpxModule } from '../sharedspx/sharedspx.module';


@NgModule({
    imports: [
        BreadcrumbModule,
        ButtonModule,
        GridModule,
        IconModule,
        RouterModule,
        SharedSpxModule,
        TableModule,
        TooltipModule,
    ],
    declarations: [
        MapComponent,
    ],
    providers: [
        provideRouter(routes),
    ],
})
export class MapModule { }
