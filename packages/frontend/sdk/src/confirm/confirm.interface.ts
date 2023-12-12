import { Observable } from 'rxjs';


export interface IHasModification {
    isModified: () => Observable<boolean> | Promise<boolean> | boolean;
}


export interface IConfirmComponent {
    confirm: (title: string, description: string) => Promise<boolean>;
}
