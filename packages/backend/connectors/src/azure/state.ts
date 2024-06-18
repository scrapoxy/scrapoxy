import { convertAzureStateToProxyStatus } from './azure.helpers';
import type {
    IAzureDeployment,
    IAzureDisk,
    IAzureNetworkInterface,
    IAzurePublicIpAddress,
    IAzureResource,
    IAzureVirtualMachine,
    IAzureVirtualMachineSimple,
} from './azure.interface';


function getName(
    prefix: string,
    fullname: string | undefined
): string | undefined {
    if (!fullname) {
        return;
    }

    const nameMatcher = new RegExp(`${prefix}-([a-zA-Z0-9]+)-(vm|nic|ip|disk)`)
        .exec(fullname);

    if (!nameMatcher) {
        return;
    }

    return nameMatcher[ 1 ];
}


function buildResourceMap<T extends IAzureResource>(
    prefix: string,
    source: T[],
    destination: Map<string, T>
) {
    for (const item of source) {
        const name = getName(
            prefix,
            item.name as string
        );

        if (name) {
            destination.set(
                name,
                item
            );
        }
    }
}


export class AzureResourceGroupState {
    private readonly disksMap = new Map<string, IAzureDisk>();

    private readonly publicIpAddressesMap = new Map<string, IAzurePublicIpAddress>();

    private readonly networkInterfacesMap = new Map<string, IAzureNetworkInterface>();

    private readonly virtualMachinesMap = new Map<string, IAzureVirtualMachineSimple>();

    private readonly deploymentNamesSet = new Set<string>();

    constructor(
        prefix: string,
        public resourceGroupName: string,
        disks: IAzureDisk[],
        publicIpAddresses: IAzurePublicIpAddress[],
        networkInterfaces: IAzureNetworkInterface[],
        virtualMachines: IAzureVirtualMachine[],
        deployments: IAzureDeployment[]
    ) {
        // Add disks
        buildResourceMap(
            prefix,
            disks,
            this.disksMap
        );

        // Add public IPs addresses
        buildResourceMap(
            prefix,
            publicIpAddresses,
            this.publicIpAddressesMap
        );

        // Add network interfaces
        buildResourceMap(
            prefix,
            networkInterfaces,
            this.networkInterfacesMap
        );

        // Add virtual machines
        const regex = new RegExp(
            `/resourceGroups/${resourceGroupName}`,
            'i'
        );
        for (const vm of virtualMachines) {
            if (vm.id.match(regex)) {
                const name = getName(
                    prefix,
                    vm.name as string
                );

                if (name) {
                    this.networkInterfacesMap.delete(name);
                    this.disksMap.delete(name);

                    let hostname: string | null;
                    const ip = this.publicIpAddressesMap.get(name);

                    if (ip) {
                        hostname = ip.properties.ipAddress ?? null;

                        this.publicIpAddressesMap.delete(name);
                    } else {
                        hostname = null;
                    }

                    const vmFound: IAzureVirtualMachineSimple = {
                        id: vm.name as string,
                        name,
                        status: convertAzureStateToProxyStatus(vm.properties?.instanceView),
                        hostname,
                    };

                    this.virtualMachinesMap.set(
                        name,
                        vmFound
                    );
                }
            }
        }

        // Add deploymnent names
        for (const deployment of deployments) {
            for (const name of deployment.properties.parameters?.vmNames?.value ?? []) {
                this.deploymentNamesSet.add(name);

                // Do not remove resources associated with deployment
                this.publicIpAddressesMap.delete(name);
                this.networkInterfacesMap.delete(name);
                this.disksMap.delete(name);
            }
        }

        // Discard used IPs
        for (const name of this.networkInterfacesMap.keys()) {
            this.publicIpAddressesMap.delete(name);
        }
    }

    get disks(): IAzureDisk[] {
        return Array.from(this.disksMap.values());
    }

    get publicIpAddresses(): IAzurePublicIpAddress[] {
        return Array.from(this.publicIpAddressesMap.values());
    }

    get networkInterfaces(): IAzureNetworkInterface[] {
        return Array.from(this.networkInterfacesMap.values());
    }

    get virtualMachines(): IAzureVirtualMachineSimple[] {
        return Array.from(this.virtualMachinesMap.values());
    }

    get deploymentNames(): string[] {
        return Array.from(this.deploymentNamesSet);
    }

    get empty(): boolean {
        const totalSize = this.disksMap.size
            + this.publicIpAddressesMap.size
            + this.networkInterfacesMap.size
            + this.virtualMachinesMap.size
            + this.deploymentNamesSet.size;

        return totalSize <= 0;
    }
}
