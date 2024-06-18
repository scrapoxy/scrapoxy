export const migration = {
    name: '0008-azure-spot-instances',
    up: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            for (const connector of project.connectors ?? []) {
                if (connector.type === 'azure') {
                    connector.config.useSpotInstances = false;
                }
            }
        }
    },
    down: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            for (const connector of project.connectors ?? []) {
                if (connector.type === 'azure') {
                    delete connector.config.useSpotInstances;
                }
            }
        }
    },
};
