import { Type } from '@angular/core';
import { FormGroup } from '@angular/forms';


export enum EConnectorType {
    Datacenter = 'datacenter',
    StaticIp = 'ip_static',
    DynamicIP = 'ip_dynamic',
    Hardware = 'hardware',
    List = 'list',
}


export interface ICoupon {
    name: string;

    description: string;
}


export interface IConnectorConfig {
    name: string;

    description: string;

    coupon: ICoupon | null;

    defaultCredentialName: string;

    defaultConnectorName: string;

    url?: string;

    type: EConnectorType;

    canInstall: boolean;

    canUninstall: boolean;

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
