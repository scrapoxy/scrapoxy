export const migration = {
    name: '0006-sources',
    up: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            for (const connector of project.connectors ?? []) {
                connector.sources = connector.sources ?? [];
            }
        }
    },
    down: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            for (const connector of project.connectors ?? []) {
                delete connector.sources;
            }
        }
    },
};
