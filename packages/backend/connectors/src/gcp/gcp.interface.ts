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


export interface IConnectorGcpInstallConfig {
    diskSize: number;
    diskType: string;
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


//////////// NETWORKS ////////////
export interface IGcpNetwork {
    id: string;
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
export interface IGcpInsertInstanceRequest {
    diskName: string;
    diskSizeGb: string;
    diskType: string;
    instanceName: string;
    machineType: string;
    networkName: string;
    sourceImage: string;
    startupScript: string;
    zone: string;
}


export interface IGcpBulkInsertInstancesRequest {
    instancesNames: string[];
    labelName: string;
    machineType: string;
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


//////////// IMAGES ////////////
export interface IGcpInsertImageRequest {
    diskName: string;
    imageName: string;
    zone: string;
}


export interface IGcpImage {
    id: string;
}


//////////// INSTANCE TEMPLATES ////////////
export interface IGcpInsertTemplateRequest {
    diskSizeGb: string;
    diskType: string;
    machineType: string;
    networkName: string;
    sourceImage: string;
    templateName: string;
}


export interface IGcpInstanceTemplate {
    id: string;
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
