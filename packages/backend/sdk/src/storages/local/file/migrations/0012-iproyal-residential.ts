export const migration = {
    name: '0012-iproyal-residential',
    up: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            for (const credential of project.credentials ?? []) {
                if (credential.type === 'iproyal-residential') {
                    delete credential.config.token;
                }
            }

            for (const connector of project.connectors ?? []) {
                if (connector.type === 'iproyal-residential') {
                    delete connector.config.state;
                    delete connector.config.city;
                }
            }
        }
    },
};
