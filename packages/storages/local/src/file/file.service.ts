import { promises as fs } from 'fs';
import {
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common';
import {
    EventsService,
    LoggerAdapter,
    ProbeprovidersService,
    StorageprovidersService,
} from '@scrapoxy/backend-sdk';
import { Umzug } from 'umzug';
import { STORAGE_FILE_MODULE_CONFIG } from './file.constants';
import { DirectStorage } from './file.helpers';
import migrations from './migrations';
import {
    fromProjectStore,
    toProjectStore,
} from './project.store';
import {
    fromUserStore,
    toUserStore,
} from './user.store';
import { AStorageLocal } from '../local.abstract';
import type { IStorageFileModuleConfig } from './file.module';
import type { IProjectStore } from './project.store';
import type { IUserStore } from './user.store';
import type { OnModuleInit } from '@nestjs/common';
import type {
    ICertificateInfo,
    IConnectorData,
    IConnectorDataToCreate,
    ICredentialData,
    IFreeproxy,
    IProjectData,
    IProjectDataCreate,
    IProjectUserLink,
    IUserData,
} from '@scrapoxy/common';


interface IStore {
    migrations: string[];
    params: { [key: string]: string };
    projects: IProjectStore[];
    users: IUserStore[];
}


@Injectable()
export class StorageFileService extends AStorageLocal<IStorageFileModuleConfig> implements OnModuleInit {
    type = 'file';

    alive = false;

    private readonly loggerFile = new Logger(StorageFileService.name);

    private readonly migrations: string[] = [];

    constructor(
    @Inject(STORAGE_FILE_MODULE_CONFIG)
        config: IStorageFileModuleConfig,
        events: EventsService,
        probes: ProbeprovidersService,
        provider: StorageprovidersService
    ) {
        super(
            config,
            events
        );

        provider.storage = this;

        probes.register(this);
    }

    async onModuleInit(): Promise<void> {
        await this.loadStore();

        this.alive = true;
    }

    async clean(): Promise<void> {
        try {
            await fs.unlink(this.config.filename);
        } catch (err: any) {
            this.loggerFile.error(`Cannot delete file: ${err.message}`);
        }
    }

    //////////// USERS ////////////
    override async createUser(user: IUserData): Promise<void> {
        await super.createUser(user);

        await this.saveStore();
    }

    override async updateUser(user: IUserData): Promise<void> {
        await super.updateUser(user);

        await this.saveStore();
    }

    //////////// PROJECTS ////////////
    override async createProject(create: IProjectDataCreate): Promise<void> {
        await super.createProject(create);

        await this.saveStore();
    }

    override async updateProject(project: IProjectData): Promise<void> {
        await super.updateProject(project);

        await this.saveStore();
    }

    override async removeProject(project: IProjectData): Promise<void> {
        await super.removeProject(project);

        await this.saveStore();
    }


    override async addUserToProject(link: IProjectUserLink): Promise<void> {
        await super.addUserToProject(link);

        await this.saveStore();
    }

    override async removeUserFromProject(link: IProjectUserLink): Promise<void> {
        await super.removeUserFromProject(link);

        await this.saveStore();
    }

    override async updateProjectToken(
        projectId: string, token: string
    ): Promise<void> {
        await super.updateProjectToken(
            projectId,
            token
        );

        await this.saveStore();
    }

    //////////// CREDENTIALS ////////////
    override async createCredential(credential: ICredentialData): Promise<void> {
        await super.createCredential(credential);

        await this.saveStore();
    }

    override async updateCredential(credential: ICredentialData): Promise<void> {
        await super.updateCredential(credential);

        await this.saveStore();
    }

    override async removeCredential(credential: ICredentialData): Promise<void> {
        await super.removeCredential(credential);

        await this.saveStore();
    }

    //////////// CONNECTORS ////////////
    override async createConnector(connector: IConnectorDataToCreate): Promise<void> {
        await super.createConnector(connector);

        await this.saveStore();
    }

    override async updateConnector(connector: IConnectorData): Promise<void> {
        await super.updateConnector(connector);

        await this.saveStore();
    }

    override async updateConnectorCertificate(
        projectId: string,
        connectorId: string,
        certificateInfo: ICertificateInfo
    ): Promise<void> {
        await super.updateConnectorCertificate(
            projectId,
            connectorId,
            certificateInfo
        );

        await this.saveStore();
    }

    override async removeConnector(connector: IConnectorData): Promise<void> {
        await super.removeConnector(connector);

        await this.saveStore();
    }

    //////////// FREE PROXIES ////////////
    override async createFreeproxies(freeproxies: IFreeproxy[]): Promise<void> {
        await super.createFreeproxies(freeproxies);

        await this.saveStore();
    }

    override async updateFreeproxies(freeproxies: IFreeproxy[]): Promise<void> {
        await super.updateFreeproxies(freeproxies);

        await this.saveStore();
    }

    override async removeFreeproxies(
        projectId: string, connectorId: string, freeproxiesIds: string[]
    ): Promise<void> {
        await super.removeFreeproxies(
            projectId,
            connectorId,
            freeproxiesIds
        );

        await this.saveStore();
    }

    //////////// MISC ////////////
    private async loadStore(): Promise<void> {
        // Clear before load
        this.migrations.length = 0;
        this.params.clear();
        this.projects.clear();
        this.projectsByName.clear();
        this.projectsToken.clear();
        this.users.clear();
        this.usersByEmail.clear();

        let store: IStore;
        try {
            const data = await fs.readFile(this.config.filename);
            store = JSON.parse(data.toString());
        } catch (err: any) {
            this.loggerFile.error(`Cannot read store: ${err.message}`);
            store = {
                migrations: [],
                params: {},
                projects: [],
                users: [],
            };
        }

        if (store.migrations && store.migrations.length > 0) {
            this.migrations.push(...store.migrations);
        }

        // Migrate data if needed
        const migrator = new Umzug({
            migrations,
            context: store,
            storage: new DirectStorage(this.migrations),
            logger: new LoggerAdapter(this.loggerFile),
        });
        const migrationsLog = await migrator.up();

        // Load params
        for (const [
            key, value,
        ] of Object.entries(store.params)) {
            this.params.set(
                key,
                value
            );
        }

        // Load projects
        const usersProjects = new Map<string, Set<string>>();
        for (const projectStore of store.projects) {
            const projectModel = fromProjectStore(projectStore);
            this.projects.set(
                projectModel.id,
                projectModel
            );

            this.projectsByName.set(
                projectModel.name,
                projectModel
            );

            this.projectsToken.set(
                projectModel.token,
                projectModel
            );

            for (const userId of projectStore.usersIds) {
                let projectsIds = usersProjects.get(userId);

                if (!projectsIds) {
                    projectsIds = new Set<string>();
                    usersProjects.set(
                        userId,
                        projectsIds
                    );
                }

                projectsIds.add(projectStore.id);
            }

            // Load free proxies
            for (const connector of projectModel.connectors.values()) {
                for (const freeproxy of connector.freeproxies.values()) {
                    this.freeproxies.set(
                        freeproxy.id,
                        freeproxy
                    );
                }
            }
        }

        // Load users
        for (const userStore of store.users) {
            const projectsIds = usersProjects.get(userStore.id) ?? new Set<string>();
            const userModel = fromUserStore(
                userStore,
                projectsIds
            );
            this.users.set(
                userModel.id,
                userModel
            );

            if (userModel.email && userModel.email.length > 0) {
                this.usersByEmail.set(
                    userModel.email,
                    userModel
                );
            }
        }

        if (migrationsLog.length > 0) {
            await this.saveStore();
        }
    }

    private async saveStore(): Promise<void> {
        const params: { [key: string]: string } = {};
        for (const [
            key, value,
        ] of this.params.entries()) {
            params[ key ] = value;
        }

        const projects = Array.from(this.projects.values())
            .map(toProjectStore);
        const users = Array.from(this.users.values())
            .map(toUserStore);
        const store: IStore = {
            migrations: this.migrations,
            params,
            projects,
            users,
        };
        const data = JSON.stringify(
            store,
            void 0,
            4
        );

        // Catch write error for read-only filesystem
        try {
            await fs.writeFile(
                this.config.filename,
                data
            );
        } catch (err: any) {
            this.loggerFile.error(`Cannot write store: ${err.message}`);
        }
    }
}
