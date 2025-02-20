import { EProxyStatus } from '@scrapoxy/common';


/***
 * @interface IConnectorAzureCredential
 * @property {string} tenantId Copy "Directory (tenant) ID" from Azure Active Directory
 * @property {string} clientId Copy "Application (client) ID" from Azure Active Directory
 * @property {string} secret Copy "Client secret" from Azure Active Directory
 * @property {string} subscriptionId Copy "Subscription ID" from Azure Active Directory
 *
 * How to use (order is important):
 * 1. Create an App Registration in Azure Active Directory
 * > name: scrapoxy
 * > accounts in this organizational directory only
 * 2. In the subscription IAM, add the app as a contributor
 * 3. Create a secret key for this app
 * 4. Wait 5 minutes for replication time
 ***/
export interface IConnectorAzureCredential {
    tenantId: string;
    clientId: string;
    secret: string;
    subscriptionId: string;
}


export interface IConnectorAzureConfig {
    location: string;
    port: number;
    resourceGroupName: string;
    vmSize: string;
    storageAccountType: string;
    prefix: string;
    useSpotInstances: boolean;
}


export interface IAzureValue<T> {
    value: T;
}


export interface IAzureResource {
    id: string;
    name: string;
}


//////////// LOCATIONS ////////////
export interface IAzureLocation extends IAzureResource {
    displayName: string;
}


//////////// VM SIZES ////////////
export interface IAzureVmSize extends IAzureResource {
    numberOfCores: number;
    memoryInMB: number;
}


//////////// RESOURCE GROUPS ////////////
export type IAzureResourceGroup = IAzureResource;


//////////// DISKS ////////////
export type IAzureDisk = IAzureResource;


//////////// NETWORK INTERFACES ////////////
export type IAzureNetworkInterface = IAzureResource;


//////////// PUBLIC IP ADDRESSES ////////////
export interface IAzurePublicIpAddress extends IAzureResource {
    properties: {
        ipAddress?: string;
    };
}


//////////// VIRTUAL MACHINES ////////////
export interface IAzureInstanceView {
    statuses?: {
        code?: string;
    }[];
}


export interface IAzureVirtualMachine extends IAzureResource {
    location: string;
    properties: {
        instanceView?: IAzureInstanceView;
    };
}


export interface IAzureVirtualMachineSimple {
    id: string;
    name: string;
    status: EProxyStatus;
    hostname: string | null;
}


export interface IAzureImageReference {
    publisher?: string;
    offer?: string;
    sku?: string;
    version?: string;
}


//////////// DEPLOYMENTS ////////////
export enum EAzureDeploymentMode {
    Incremental = 'Incremental',
}


export interface IAzureDeploymentRequest {
    properties: {
        template: any;
        parameters: {
            [key: string]: {
                value: any;
            };
        };
        mode: EAzureDeploymentMode;
    };
}


export enum EAzureProvisioningState {
    Running = 'Running',
    Accepted = 'Accepted',
    Succeeded = 'Succeeded',
    Creating = 'Creating',
}


export interface IAzureDeployment extends IAzureResource {
    properties: {
        parameters: any;
        provisioningState: EAzureProvisioningState;
        error?: IAzureError;
    };
}


//////////// ERROR ////////////
export interface IAzureError {
    code: string;
    message: string;
    details?: {
        message: string;
    }[];
}
