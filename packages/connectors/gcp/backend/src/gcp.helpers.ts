import type { IGcpInstance } from './gcp.interface';


export function getGcpExternalIp(instance: IGcpInstance): string | undefined {
    if (!instance?.networkInterfaces ||
        instance.networkInterfaces.length <= 0) {
        return;
    }

    const networkInterface = instance.networkInterfaces[ 0 ];

    if (!networkInterface.accessConfigs ||
        networkInterface.accessConfigs.length <= 0) {
        return;
    }

    return networkInterface.accessConfigs[ 0 ].natIP;
}
