import { Type } from '@angular/core';
import { FormGroup } from '@angular/forms';


export enum EConnectorFactoryGroup {
    DatacenterProvider = 'datacenter_provider',
    ProxiesServiceStatic = 'proxies_service_static',
    ProxiesServiceDynamic = 'proxies_service_dynamic',
    Hardware = 'hardware',
    Other = 'freeproxies',
}


export interface IConnectorConfig {
    name: string;

    description: string;

    url?: string;

    group: EConnectorFactoryGroup;

    canInstall: boolean;

    canUninstall: boolean;

    canReplaceProxy: boolean;

    useCertificate: boolean;
}


export interface IConnectorFactory {
    type: string;

    config: IConnectorConfig;

    init: () => void;

    getCredentialComponent: () => Type<ICredentialComponent>;

    getConnectorComponent: () => Type<IConnectorComponent>;

    getInstallComponent: () => Type<IInstallComponent>;
}


export interface IConnectorComponent {
    form: FormGroup;

    projectId: string;

    credentialId: string;

    connectorId: string | undefined;

    createMode: boolean;
}


export interface ICredentialComponent {
    form: FormGroup;

    projectId: string;

    credentialId: string | undefined;

    createMode: boolean;
}


export interface IInstallComponent {
    form: FormGroup;
}
