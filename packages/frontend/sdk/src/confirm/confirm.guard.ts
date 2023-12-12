import { Injectable } from '@angular/core';
import { ConfirmService } from './confirm.service';
import type { IHasModification } from './confirm.interface';
import type { CanDeactivate } from '@angular/router';


@Injectable()
export class ConfirmGuard implements CanDeactivate<IHasModification> {

    constructor(private readonly confirmService: ConfirmService) {}

    async canDeactivate(component: IHasModification) {
        if (component.isModified()) {
            return this.confirmService.confirm(
                'Discard modification',
                'Do you want to discard modifications ?'
            );
        }

        return true;
    }
}
