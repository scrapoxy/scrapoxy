export const migration = {
    name: '0014-brightdata-v3',
    up: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            for (const connector of project.connectors ?? []) {
                if (connector.type === 'brightdata') {
                    delete connector.config.zoneType;
                    connector.config.country = 'all';
                }
            }
        }
    },
};
