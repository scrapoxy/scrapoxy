import {
    Component,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';
import type { IProjectView } from '@scrapoxy/common';


@Component({
    selector: 'project-view',
    templateUrl: 'view.component.html',
    styleUrls: [
        'view.component.scss',
    ],
})
export class ProjectViewComponent {
    @Input()
    project: IProjectView;

    @Output() selectProject = new EventEmitter<void>();
}
