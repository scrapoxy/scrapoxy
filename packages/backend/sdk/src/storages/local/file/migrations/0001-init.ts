import { v4 as uuid } from 'uuid';


export const migration = {
    name: '0001-init',
    up: async({ context: data }: { context: any }) => {
        data.params = data.params ?? {};
        data.params.installId = uuid();

        data.projects = data.projects ?? [];

        data.users = data.users ?? [];
    },
    down: async({ context: data }: { context: any }) => {
        delete data.params;

        delete data.projects;

        delete data.users;
    },
};
