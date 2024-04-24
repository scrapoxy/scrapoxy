export const migration = {
    name: '0007-brightdata-v2',
    up: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            for (const connector of project.connectors ?? []) {
                if (connector.type === 'brightdata') {
                    connector.config.country = 'all';
                }
            }
        }
    },
    down: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            for (const connector of project.connectors ?? []) {
                if (connector.type === 'brightdata') {
                    delete connector.config.country;
                }
            }
        }
    },
};
