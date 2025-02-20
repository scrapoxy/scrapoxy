export const migration = {
    name: '0015-remove-install',
    up: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            for (const connector of project.connectors ?? []) {
                switch (connector.type) {
                    case 'aws': {
                        delete connector.config.imageId;
                        break;
                    }

                    case 'azure': {
                        delete connector.config.imageResourceGroupName;
                        break;
                    }

                    case 'digitalocean':
                    case 'ovh':{
                        delete connector.config.snapshotId;
                        break;
                    }

                    case 'scaleway':{
                        delete connector.config.imageId;
                        delete connector.config.snapshotId;
                        break;
                    }

                    case 'tencent':{
                        delete connector.config.imageId;
                        break;
                    }

                    default: {
                        // Ignore
                    }
                }
            }
        }
    },
};
