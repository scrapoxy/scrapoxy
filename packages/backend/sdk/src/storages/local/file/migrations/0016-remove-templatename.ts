export const migration = {
    name: '0016-remove-templatename',
    up: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            for (const connector of project.connectors ?? []) {
                if (connector.type === 'gcp') {
                    delete connector.config.templateName;
                }
            }
        }
    },
};
