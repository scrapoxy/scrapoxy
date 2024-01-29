export const migration = {
    name: '0004-iproyal',
    up: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            for (const credential of project.credentials ?? []) {
                if (credential.type === 'iproyal') {
                    credential.type = 'iproyal-server';
                }
            }
            for (const connector of project.connectors ?? []) {
                if (connector.type === 'iproyal') {
                    connector.type = 'iproyal-server';
                }
            }
        }
    },
    down: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            for (const credential of project.credentials ?? []) {
                if (credential.type === 'iproyal-server') {
                    credential.type = 'iproyal';
                }
            }
            for (const connector of project.connectors ?? []) {
                if (connector.type === 'iproyal-server') {
                    connector.type = 'iproyal';
                }
            }
        }
    },
};
