export const migration = {
    name: '0010-zyte-url',
    up: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            for (const connector of project.connectors ?? []) {
                if (connector.type === 'zyte') {
                    connector.config.apiUrl = 'proxy.crawlera.com:8011';
                }
            }
        }
    },
    down: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            for (const connector of project.connectors ?? []) {
                if (connector.type === 'zyte') {
                    delete connector.config.apiUrl;
                }
            }
        }
    },
};
