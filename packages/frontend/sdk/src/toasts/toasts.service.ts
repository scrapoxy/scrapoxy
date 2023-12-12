import { Injectable } from '@angular/core';
import { EToasterType } from './toasts.interface';
import type { IToasterComponent } from './toasts.interface';


@Injectable()
export class ToastsService {
    private toaster: IToasterComponent | undefined = void 0;

    register(toaster: IToasterComponent) {
        this.toaster = toaster;
    }

    success(
        title: string, message: string
    ) {
        if (!this.toaster) {
            throw new Error('Toaster not initialized');
        }

        this.toaster.toast(
            title,
            message,
            EToasterType.Success
        );
    }

    error(
        title: string, message: string
    ) {
        if (!this.toaster) {
            throw new Error('Toaster not initialized');
        }

        this.toaster.toast(
            title,
            message,
            EToasterType.Error
        );
    }
}
