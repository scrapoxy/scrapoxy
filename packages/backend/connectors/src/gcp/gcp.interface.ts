export interface IConnectorGcpCredential {
    projectId: string;
    clientEmail: string;
    privateKeyId: string;
    privateKey: string;
}


export interface IConnectorGcpConfig {
    firewallName: string;
    machineType: string;
    networkName: string;
    port: number;
    label: string;
    templateName: string;
    zone: string;
}


export interface IGcpItems<T> {
    items?: T[];
}


//////////// ZONES ////////////
export interface IGcpZone {
    id: string;
    name: string;
}


//////////// MACHINE TYPES ////////////
export interface IGcpMachineType {
    id: string;
    name: string;
}


//////////// FIREWALLS ////////////
export interface IGcpFirewall {
    id: string;
}


export interface IGcpFirewallRule {
    ports: string[];
    // eslint-disable-next-line @typescript-eslint/naming-convention
    IPProtocol: string;
}


export interface IGcpInsertFirewallRequest {
    allowed: IGcpFirewallRule[];
    firewallName: string;
    networkName: string;
    priority: number;
}


//////////// INSTANCES ////////////
export interface IGcpBulkInsertInstancesRequest {
    diskSizeGb: string;
    diskType: string;
    instancesNames: string[];
    labelName: string;
    machineType: string;
    networkName: string;
    sourceImage: string;
    templateName: string;
    zone: string;
    startupScript: string;
}


export enum EGcpInstanceStatus {
    PROVISIONING = 'PROVISIONING',
    REPAIRING = 'REPAIRING',
    RUNNING = 'RUNNING',
    SUSPENDING = 'SUSPENDING',
    STAGING = 'STAGING',
    STOPPING = 'STOPPING',
    SUSPENDED = 'SUSPENDED',
    TERMINATED = 'TERMINATED',
}


export interface IGcpInstance {
    id: string;
    name: string;
    networkInterfaces: {
        accessConfigs: {
            natIP: string;
        }[];
    }[];
    status: EGcpInstanceStatus;
}


//////////// OPERATIONS ////////////
export enum EGcpOperationStatus {
    DONE = 'DONE',
    PENDING = 'PENDING',
    RUNNING = 'RUNNING',
}


export interface IGcpOperation {
    id: string;
    status: EGcpOperationStatus;
}
