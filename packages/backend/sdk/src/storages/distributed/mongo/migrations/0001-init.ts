import { v4 as uuid } from 'uuid';
import {
    CERTIFICATES_KEY,
    CONNECTORS_KEY,
    CREDENTIALS_KEY,
    FREEPROXIES_KEY,
    PARAMS_KEY,
    PROJECTS_KEY,
    PROXIES_KEY,
    TASKS_KEY,
    USERS_KEY,
    WINDOWS_KEY,
} from '../mongo.constants';
import {
    createCollectionFailsafe,
    dropCollectionFailsafe,
} from '../mongo.helpers';
import type { IMongoConnection } from '../mongo.interface';


export const migration = {
    name: '0001-init',
    up: async({ context: conn }: { context: IMongoConnection }) => {
        // Certificates
        await createCollectionFailsafe(
            conn.db,
            CERTIFICATES_KEY,
            {
                capped: true,
                size: conn.config.certificatesCollectionSizeInBytes,

            }
        );

        // Connectors
        await createCollectionFailsafe(
            conn.db,
            CONNECTORS_KEY
        );


        // Credentials
        await createCollectionFailsafe(
            conn.db,
            CREDENTIALS_KEY
        );

        // Freeproxies
        await createCollectionFailsafe(
            conn.db,
            FREEPROXIES_KEY
        );

        // Params
        try {
            const colParams = await conn.db.createCollection(PARAMS_KEY);

            await colParams.insertOne({
                _id: 'installId' as any,
                value: uuid(),
            });
        } catch (err: any) {
            if (err.codeName !== 'NamespaceExists') {
                throw err;
            }
        }

        // Projects
        try {
            const colProjects = await conn.db.createCollection(PROJECTS_KEY);

            await colProjects.createIndexes([
                {
                    key: {
                        name: 1,
                    },
                    name: 'name',
                    unique: true,
                },
            ]);
        } catch (err: any) {
            if (err.codeName !== 'NamespaceExists') {
                throw err;
            }
        }

        // Proxies
        await createCollectionFailsafe(
            conn.db,
            PROXIES_KEY
        );

        // Tasks
        await createCollectionFailsafe(
            conn.db,
            TASKS_KEY
        );

        // Users
        try {
            const colUsers = await conn.db.createCollection(USERS_KEY);

            await colUsers.createIndexes([
                {
                    key: {
                        email: 1,
                    },
                    name: 'email',
                    unique: false,
                },
            ]);
        } catch (err: any) {
            if (err.codeName !== 'NamespaceExists') {
                throw err;
            }
        }

        // Windows
        await createCollectionFailsafe(
            conn.db,
            WINDOWS_KEY
        );
    },
    down: async({ context: conn }: { context: IMongoConnection }) => {
        await Promise.all([
            dropCollectionFailsafe(
                conn.db,
                WINDOWS_KEY
            ),
            dropCollectionFailsafe(
                conn.db,
                USERS_KEY
            ),
            dropCollectionFailsafe(
                conn.db,
                TASKS_KEY
            ),
            dropCollectionFailsafe(
                conn.db,
                PROXIES_KEY
            ),
            dropCollectionFailsafe(
                conn.db,
                PROJECTS_KEY
            ),
            dropCollectionFailsafe(
                conn.db,
                PARAMS_KEY
            ),
            // Don't remove MIGRATIONS_KEY
            dropCollectionFailsafe(
                conn.db,
                FREEPROXIES_KEY
            ),
            dropCollectionFailsafe(
                conn.db,
                CREDENTIALS_KEY
            ),
            dropCollectionFailsafe(
                conn.db,
                CONNECTORS_KEY
            ),
            dropCollectionFailsafe(
                conn.db,
                CERTIFICATES_KEY
            ),
        ]);
    },
};
