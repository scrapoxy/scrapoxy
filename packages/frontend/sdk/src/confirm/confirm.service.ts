import { Injectable } from '@angular/core';
import type { IConfirmComponent } from './confirm.interface';


@Injectable()
export class ConfirmService {
    private component: IConfirmComponent | undefined = void 0;

    register(component: IConfirmComponent) {
        this.component = component;
    }

    confirm(
        title: string, description: string
    ): Promise<boolean> {
        if (!this.component) {
            throw new Error('ConfirmService not initialized');
        }

        return this.component.confirm(
            title,
            description
        );
    }
}
