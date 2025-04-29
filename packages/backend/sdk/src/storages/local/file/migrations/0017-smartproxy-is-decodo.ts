export const migration = {
    name: '0017-smartproxy-is-decodo',
    up: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            for (const credential of project.credentials ?? []) {
                if (credential.type === 'smartproxy') {
                    credential.type = 'decodo';

                    if (credential.name) {
                        credential.name = credential.name.replaceAll(
                            'Smartproxy',
                            'Decodo'
                        );
                    }
                }
            }

            for (const connector of project.connectors ?? []) {
                if (connector.type === 'smartproxy') {
                    connector.type = 'decodo';

                    if (connector.name) {
                        connector.name = connector.name.replaceAll(
                            'Smartproxy',
                            'Decodo'
                        );
                    }
                }
            }
        }
    },
    down: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            for (const credential of project.credentials ?? []) {
                if (credential.type === 'decodo') {
                    credential.type = 'smartproxy';

                    if (credential.name) {
                        credential.name = credential.name.replaceAll(
                            'Decodo',
                            'Smartproxy'
                        );
                    }
                }
            }

            for (const connector of project.connectors ?? []) {
                if (connector.type === 'decodo') {
                    connector.type = 'smartproxy';

                    if (connector.name) {
                        connector.name = connector.name.replaceAll(
                            'Decodo',
                            'Smartproxy'
                        );
                    }
                }
            }
        }
    },
};
