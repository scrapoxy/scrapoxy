export const CREDENTIAL_VIEW_META = [
    'id',
    'projectId',
    'name',
    'type',
];


export interface ICredentialView {
    id: string;
    projectId: string;
    name: string;
    type: string;
}


export const CREDENTIAL_DATA_META = [
    ...CREDENTIAL_VIEW_META, 'config',
];


export interface ICredentialData extends ICredentialView {
    config: any;
}


export interface ICredentialToUpdate {
    name: string;
    config: any;
}


export interface ICredentialToCreate extends ICredentialToUpdate {
    type: string;
}


export interface ICredentialToCreateCallback {
    projectId: string;
    name: string;
    type: string;
    config: any;
}


export interface ICredentialQuery {
    type: string;
    parameters?: any;
}
