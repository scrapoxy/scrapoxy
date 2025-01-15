export const migration = {
    name: '0013-country-case',
    up: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            for (const connector of project.connectors ?? []) {
                switch (connector.type) {
                    case 'netnut': {
                        if (connector.config.country === 'any') {
                            connector.config.country = 'all';
                        }
                        break;
                    }

                    case 'brightdata':
                    case 'nimble':
                    case 'iproyal-residential':
                    case 'proxy-seller-server':
                    case 'smartproxy': {
                        if (connector.config.country) {
                            connector.config.country = connector.config.country.toLowerCase();
                        }
                        break;
                    }

                    case 'proxy-seller-residential': {
                        if (connector.config.countryCode) {
                            connector.config.countryCode = connector.config.countryCode.toLowerCase();
                        }
                        break;
                    }

                    case 'zyte': {
                        if (connector.config.region) {
                            connector.config.region = connector.config.region.toLowerCase();
                        }
                        break;
                    }
                }
            }
        }
    },
    down: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            for (const connector of project.connectors ?? []) {
                switch (connector.type) {
                    case 'netnut': {
                        if (connector.config.country === 'all') {
                            connector.config.country = 'any';
                        }
                        break;
                    }

                    case 'brightdata':
                    case 'nimble':
                    case 'iproyal-residential':
                    case 'proxy-seller-server':
                    case 'smartproxy': {
                        if (connector.config.country) {
                            connector.config.country = connector.config.country.toUpperCase();
                        }
                        break;
                    }

                    case 'proxy-seller-residential': {
                        if (connector.config.countryCode) {
                            connector.config.countryCode = connector.config.countryCode.toUpperCase();
                        }
                        break;
                    }

                    case 'zyte': {
                        if (connector.config.region) {
                            connector.config.region = connector.config.region.toUpperCase();
                        }
                        break;
                    }
                }
            }
        }
    },
};
