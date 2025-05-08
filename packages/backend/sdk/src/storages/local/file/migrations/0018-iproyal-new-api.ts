export const migration = {
    name: '0018-iproyal-new-api',
    up: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            for (const connector of project.connectors ?? []) {
                if (connector.type === 'iproyal-server') {
                    const config = connector.config;
                    const product = config.product;
                    delete config.product;

                    if (product?.toLowerCase()
                        .includes('isp')) {
                        config.productId = 9;
                    } else {
                        config.productId = 3;
                    }
                }
            }
        }
    },
    down: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            for (const connector of project.connectors ?? []) {
                if (connector.type === 'iproyal-server') {
                    const config = connector.config;
                    const productId = config.productId;
                    delete config.productId;

                    switch (productId) {
                        case 9: {
                            config.product = 'ISP (Static Residential)';
                            break;
                        }

                        case 3: {
                            config.product = 'Datacenter';
                            break;
                        }

                        default: {
                            config.product = 'all';
                            break;
                        }
                    }
                }
            }
        }
    },
};
