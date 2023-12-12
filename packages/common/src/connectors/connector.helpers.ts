import type {
    IConnectorData,
    IConnectorView,
} from './connector.interface';


export function toConnectorView(c: IConnectorView): IConnectorView {
    const data: IConnectorView = {
        id: c.id,
        projectId: c.projectId,
        name: c.name,
        type: c.type,
        active: c.active,
        proxiesMax: c.proxiesMax,
        error: c.error,
        certificateEndAt: c.certificateEndAt,
    };

    return data;
}


export function toConnectorData(c: IConnectorData): IConnectorData {
    const data: IConnectorData = {
        id: c.id,
        projectId: c.projectId,
        name: c.name,
        type: c.type,
        active: c.active,
        proxiesMax: c.proxiesMax,
        error: c.error,
        certificateEndAt: c.certificateEndAt,
        credentialId: c.credentialId,
        config: c.config,
    };

    return data;
}
