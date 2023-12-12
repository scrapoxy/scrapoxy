import { SCRAPOXY_CLOUD_PREFIX } from '@scrapoxy/common';
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
                        name: SCRAPOXY_CLOUD_PREFIX,
                        properties: {
                            description: SCRAPOXY_CLOUD_PREFIX,
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

    addVmReference(
        name: string,
        imageReference: IAzureImageReference,
        installScript: string
    ): AzureVmsTemplateBuilder {
        this.addVmIp(name);
        this.addVmNic(name);

        const userDataB64 = Buffer.from(installScript)
            .toString('base64');
        const
            adminPassword = `#${Buffer.from(uuid())
                .toString('base64')}#`,
            adminUsername = `#${Buffer.from(uuid())
                .toString('base64')}#`;
        const vm = {
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
        this.resources.push(vm);

        return this;
    }

    addVms(names: string[]): AzureVmsTemplateBuilder {
        for (const name of names) {
            this.addVm(name);
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

    private addVm(name: string): AzureVmsTemplateBuilder {
        this.addVmIp(name);
        this.addVmNic(name);

        const vm = {
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
                storageProfile: {
                    imageReference: {
                        id: `[concat('/subscriptions/', parameters('subscriptionId'), '/resourceGroups/', parameters('imageResourceGroupName'), '/providers/Microsoft.Compute/galleries/', '${this.prefix}img_${SCRAPOXY_CLOUD_PREFIX}_gal/images/${this.prefix}img_${SCRAPOXY_CLOUD_PREFIX}_def/versions/1.0.0')]`,
                    },
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

        this.resources.push(vm);

        this.parameters.subscriptionId = {
            type: 'string',
        };
        this.parameters.imageResourceGroupName = {
            type: 'string',
        };

        return this;
    }
}


export class AzureImageTemplateBuilder {
    constructor(private readonly prefix: string) {
    }

    build(): any {
        return {
            $schema: 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#',
            contentVersion: '1.0.0.0',
            parameters: {
                subscriptionId: {
                    type: 'string',
                },
                imageResourceGroupName: {
                    type: 'string',
                },
                location: {
                    type: 'string',
                },
                galleryName: {
                    type: 'string',
                },
                storageAccountType: {
                    type: 'string',
                },
                vmName: {
                    type: 'string',
                },
            },
            resources: [
                {
                    type: 'Microsoft.Compute/galleries',
                    name: `[concat('${this.prefix}_', parameters('galleryName'), '_gal')]`,
                    apiVersion: '2019-03-01',
                    location: '[parameters(\'location\')]',
                    properties: {},
                    tags: {},
                },
                {
                    type: 'Microsoft.Compute/galleries/images',
                    dependsOn: [
                        `[concat('Microsoft.Compute/galleries/${this.prefix}_', parameters('galleryName'), '_gal')]`,
                    ],
                    name: `[concat('${this.prefix}_', parameters('galleryName'), '_gal/${this.prefix}_', parameters('galleryName'), '_def')]`,
                    apiVersion: '2019-07-01',
                    location: '[parameters(\'location\')]',
                    properties: {
                        osType: 'Linux',
                        osState: 'Specialized',
                        identifier: {
                            publisher: SCRAPOXY_CLOUD_PREFIX,
                            offer: `${this.prefix}offer`,
                            sku: `${this.prefix}sku`,
                        },
                        recommended: {
                            vCPUs: {
                                min: '1',
                                max: '16',
                            },
                            memory: {
                                min: '1',
                                max: '32',
                            },
                        },
                        hyperVGeneration: 'V1',
                    },
                    tags: {},
                },
                {
                    type: 'Microsoft.Compute/galleries/images/versions',
                    dependsOn: [
                        `[concat('Microsoft.Compute/galleries/${this.prefix}_', parameters('galleryName'), '_gal/images/${this.prefix}_', parameters('galleryName'), '_def')]`,
                    ],
                    name: `[concat('${this.prefix}_', parameters('galleryName'), '_gal/${this.prefix}_', parameters('galleryName'), '_def/1.0.0')]`,
                    apiVersion: '2020-09-30',
                    location: '[parameters(\'location\')]',
                    properties: {
                        publishingProfile: {
                            replicaCount: 1,
                            targetRegions: [
                                {
                                    name: '[parameters(\'location\')]',
                                    regionalReplicaCount: 1,
                                    storageAccountType: '[parameters(\'storageAccountType\')]',
                                },
                            ],
                            excludeFromLatest: false,
                        },
                        storageProfile: {
                            osDiskImage: {
                                hostCaching: 'None',
                                source: {
                                    id: `[concat('/subscriptions/', parameters('subscriptionId'), '/resourceGroups/', parameters('imageResourceGroupName'), '/providers/Microsoft.Compute/disks/', '${this.prefix}-', parameters('vmName'), '-disk')]`,
                                },
                            },
                        },
                    },
                },
            ],
        };
    }
}
