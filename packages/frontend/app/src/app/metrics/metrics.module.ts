import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    provideRouter,
    RouterModule,
} from '@angular/router';
import {
    BreadcrumbModule,
    ButtonGroupModule,
    ButtonModule,
    CardModule,
    GridModule,
    SharedModule,
    WidgetModule,
} from '@coreui/angular';
import { ChartjsModule } from '@coreui/angular-chartjs';
import { IconModule } from '@coreui/icons-angular';
import { MetricsComponent } from './metrics.component';
import { routes } from './metrics.routes';
import { WidgetRangeComponent } from './widget-range/range.component';
import { SharedSpxModule } from '../sharedspx/sharedspx.module';


@NgModule({
    imports: [
        ButtonGroupModule,
        ButtonModule,
        BreadcrumbModule,
        CardModule,
        ChartjsModule,
        FormsModule,
        GridModule,
        IconModule,
        RouterModule,
        SharedModule,
        SharedSpxModule,
        WidgetModule,
    ],
    declarations: [
        MetricsComponent, WidgetRangeComponent,
    ],
    providers: [
        provideRouter(routes),
    ],
})
export class MetricsModule { }
