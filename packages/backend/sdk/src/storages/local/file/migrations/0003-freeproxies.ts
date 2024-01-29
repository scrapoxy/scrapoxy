export const migration = {
    name: '0003-freeproxies',
    up: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            for (const connector of project.connectors ?? []) {
                for (const freeproxy of connector.freeproxies ?? []) {
                    if (freeproxy.auth) {
                        const auth = freeproxy.auth;

                        auth.username = auth.login;
                        delete auth.login;
                    }
                }
            }
        }
    },
    down: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            for (const connector of project.connectors ?? []) {
                for (const freeproxy of connector.freeproxies ?? []) {
                    if (freeproxy.auth) {
                        const auth = freeproxy.auth;

                        auth.login = auth.username;
                        delete auth.username;
                    }
                }
            }
        }
    },
};
