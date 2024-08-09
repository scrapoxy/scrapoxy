export const migration = {
    name: '0009-ciphers-shuffle',
    up: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            project.ciphersShuffle = false;
        }
    },
    down: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            delete project.ciphersShuffle;
        }
    },
};
