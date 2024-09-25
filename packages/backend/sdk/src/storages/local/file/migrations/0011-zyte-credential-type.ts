export const migration = {
    name: '0011-zyte-credential-type',
    up: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            for (const credential of project.credentials ?? []) {
                if (credential.type === 'zyte') {
                    credential.config.credentialType = 'spm';
                }
            }
        }
    },
    down: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            for (const credential of project.credentials ?? []) {
                if (credential.type === 'zyte') {
                    delete credential.config.credentialType;
                }
            }
        }
    },
};
