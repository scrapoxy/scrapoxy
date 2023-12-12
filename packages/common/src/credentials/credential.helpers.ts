import type {
    ICredentialData,
    ICredentialView,
} from './credential.interface';


export function toCredentialView(c: ICredentialView): ICredentialView {
    const view: ICredentialView = {
        id: c.id,
        projectId: c.projectId,
        name: c.name,
        type: c.type,
    };

    return view;
}


export function toCredentialData(c: ICredentialData): ICredentialData {
    const data: ICredentialData = {
        id: c.id,
        projectId: c.projectId,
        name: c.name,
        type: c.type,
        config: c.config,
    };

    return data;
}
