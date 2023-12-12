export const migration = {
    name: '0002-proxidize',
    up: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            for (const credential of project.credentials ?? []) {
                if (credential.type === 'proxidize') {
                    const config = credential.config;
                    config.apiUrl = config.url;
                    delete config.url;
                    config.proxyUsername = config.username;
                    delete config.username;
                    config.proxyPassword = config.password;
                    delete config.password;
                }
            }
        }
    },
    down: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            for (const credential of project.credentials ?? []) {
                if (credential.type === 'proxidize') {
                    const config = credential.config;
                    config.url = config.apiUrl;
                    delete config.apiUrl;
                    config.username = config.proxyUsername;
                    delete config.proxyUsername;
                    config.password = config.proxyPassword;
                    delete config.proxyPassword;
                }
            }
        }
    },
};
