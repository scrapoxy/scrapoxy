import {
    Component,
    HostBinding,
    Input,
} from '@angular/core';
import type { OnInit } from '@angular/core';


@Component({
    selector: 'c-sidebar-brand-alt',
    templateUrl: './brand.component.html',
})
export class SidebarBrandAltComponent implements OnInit {

    @Input() brandFull?: any;

    @Input() brandNarrow?: any;

    @Input() link?: any[] | string;

    @HostBinding('class.sidebar-brand') sidebarBrandClass = true;

    brandImg = false;

    ngOnInit(): void {
        this.brandImg = Boolean(this.brandFull || this.brandNarrow);
    }
}
