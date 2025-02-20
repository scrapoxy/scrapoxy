import { SCRAPOXY_DATACENTER_PREFIX } from '@scrapoxy/common';
import { v4 as uuid } from 'uuid';
import type { IAzureImageReference } from './azure.interface';


export class AzureVmsTemplateBuilder {
    private readonly resources: any = [
        {
            type: 'Microsoft.Network/virtualNetworks',
            apiVersion: '2020-05-01',
            name: 'default-vnet',
            location: '[parameters(\'location\')]',
            dependsOn: [
                '[resourceId(\'Microsoft.Network/networkSecurityGroups\', \'default-nsg\')]',
            ],
            properties: {
                addressSpace: {
                    addressPrefixes: [
                        '10.0.0.0/16',
                    ],
                },
                subnets: [
                    {
                        name: 'default-snet',
                        properties: {
                            addressPrefix: '10.0.0.0/16',
                            networkSecurityGroup: {
                                id: '[resourceId(\'Microsoft.Network/networkSecurityGroups\', \'default-nsg\')]',
                            },
                        },
                    },
                ],
            },
        },
    ];

    private readonly parameters: any = {
        location: {
            type: 'string',
        },
        vmSize: {
            type: 'string',
        },
        storageAccountType: {
            type: 'string',
        },
        vmNames: {
            type: 'array',
            defaultValue: [],
        },
    };

    constructor(
        private readonly prefix: string,
        port: number
    ) {
        this.resources.push({
            type: 'Microsoft.Network/networkSecurityGroups',
            apiVersion: '2020-05-01',
            name: 'default-nsg',
            location: '[parameters(\'location\')]',
            properties: {
                securityRules: [
                    {
                        name: SCRAPOXY_DATACENTER_PREFIX,
                        properties: {
                            description: SCRAPOXY_DATACENTER_PREFIX,
                            protocol: 'Tcp',
                            sourcePortRange: '*',
                            destinationPortRange: port.toString(),
                            sourceAddressPrefix: '*',
                            destinationAddressPrefix: '*',
                            access: 'Allow',
                            priority: 1000,
                            direction: 'Inbound',
                        },
                    },
                ],
            },
        });
    }

    addVms(
        names: string[],
        imageReference: IAzureImageReference,
        runScript: string,
        useSpotInstances: boolean
    ): AzureVmsTemplateBuilder {
        for (const name of names) {
            this.addVm(
                name,
                imageReference,
                runScript,
                useSpotInstances
            );
        }

        return this;
    }

    build(): any {
        return {
            $schema: 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#',
            contentVersion: '1.0.0.0',
            parameters: this.parameters,
            resources: this.resources,
        };
    }

    private addVmIp(name: string): AzureVmsTemplateBuilder {
        const publicIpAddress = {
            type: 'Microsoft.Network/publicIPAddresses',
            apiVersion: '2020-05-01',
            name: `${this.prefix}-${name}-ip`,
            location: '[parameters(\'location\')]',
            properties: {
                publicIPAllocationMethod: 'Dynamic',
            },
            sku: {
                name: 'Basic',
            },
        };
        this.resources.push(publicIpAddress);

        return this;
    }

    private addVmNic(name: string): AzureVmsTemplateBuilder {
        const nic = {
            type: 'Microsoft.Network/networkInterfaces',
            apiVersion: '2020-05-01',
            name: `${this.prefix}-${name}-nic`,
            location: '[parameters(\'location\')]',
            dependsOn: [
                `[resourceId('Microsoft.Network/publicIPAddresses', '${this.prefix}-${name}-ip')]`, '[resourceId(\'Microsoft.Network/virtualNetworks\', \'default-vnet\')]', '[resourceId(\'Microsoft.Network/networkSecurityGroups\', \'default-nsg\')]',
            ],
            properties: {
                ipConfigurations: [
                    {
                        name: 'ipconfig1',
                        properties: {
                            privateIPAllocationMethod: 'Dynamic',
                            publicIPAddress: {
                                id: `[resourceId('Microsoft.Network/publicIPAddresses',  '${this.prefix}-${name}-ip')]`,
                            },
                            subnet: {
                                id: '[resourceId(\'Microsoft.Network/virtualNetworks/subnets\', \'default-vnet\', \'default-snet\')]',
                            },
                        },
                    },
                ],
            },
        };
        this.resources.push(nic);

        return this;
    }

    private addVm(
        name: string,
        imageReference: IAzureImageReference,
        runScript: string,
        useSpotInstances: boolean
    ): AzureVmsTemplateBuilder {
        this.addVmIp(name);
        this.addVmNic(name);

        const
            userDataB64 = Buffer.from(runScript)
                .toString('base64');
        const
            adminPassword = `#${Buffer.from(uuid())
                .toString('base64')}#`,
            adminUsername = `#${Buffer.from(uuid())
                .toString('base64')}#`;
        const vm: any = {
            type: 'Microsoft.Compute/virtualMachines',
            apiVersion: '2019-12-01',
            name: `${this.prefix}-${name}-vm`,
            location: '[parameters(\'location\')]',
            dependsOn: [
                `[resourceId('Microsoft.Network/networkInterfaces', '${this.prefix}-${name}-nic')]`,
            ],
            properties: {
                hardwareProfile: {
                    vmSize: '[parameters(\'vmSize\')]',
                },
                osProfile: {
                    computerName: name,
                    adminUsername,
                    adminPassword,
                    customData: userDataB64,
                },
                storageProfile: {
                    imageReference,
                    osDisk: {
                        name: `${this.prefix}-${name}-disk`,
                        createOption: 'fromImage',
                        managedDisk: {
                            storageAccountType: '[parameters(\'storageAccountType\')]',
                        },
                    },
                },
                networkProfile: {
                    networkInterfaces: [
                        {
                            id: `[resourceId('Microsoft.Network/networkInterfaces', '${this.prefix}-${name}-nic')]`,
                        },
                    ],
                },
                diagnosticsProfile: {
                    bootDiagnostics: {
                        enabled: false,
                    },
                },
            },
        };

        if (useSpotInstances) {
            vm.properties = {
                ...vm.properties,
                priority: 'Spot',
                evictionPolicy: 'Deallocate',
                billingProfile: {
                    maxPrice: -1,
                },
            };
        }

        this.resources.push(vm);

        this.parameters.subscriptionId = {
            type: 'string',
        };

        return this;
    }
}
