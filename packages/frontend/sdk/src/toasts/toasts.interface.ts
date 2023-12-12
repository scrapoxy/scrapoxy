export enum EToasterType {
    Success = 'success',
    Error = 'Error',
}


export interface IToasterComponent {
    toast: (title: string, message: string, type: EToasterType) => any;
}
