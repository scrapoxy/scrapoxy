import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GridModule } from '@coreui/angular';


@Component({
    standalone: true,
    templateUrl: '404.component.html',
    styleUrls: [
        './404.component.scss',
    ],
    imports: [
        GridModule, RouterModule,
    ],
})
export class P404Component {}
