import { Injectable } from '@angular/core';
import {
    BehaviorSubject,
    Observable,
} from 'rxjs';
import type { IProjectData } from '@scrapoxy/common';


@Injectable()
export class ProjectCurrentService {
    project$: Observable<IProjectData | undefined>;

    private readonly project: BehaviorSubject<IProjectData | undefined>;

    constructor() {
        this.project = new BehaviorSubject<IProjectData | undefined>(void 0);
        this.project$ = this.project.asObservable();
    }

    add(project: IProjectData): void {
        this.project.next(project);
    }

    clear(): void {
        this.project.next(void 0);
    }
}
