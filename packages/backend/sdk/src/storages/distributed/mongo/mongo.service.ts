import { Logger } from '@nestjs/common';
import {
    CONNECTOR_FREEPROXIES_TYPE,
    EProxyStatus,
    toOptionalValue,
    toUserData,
    WINDOWS_CONFIG,
} from '@scrapoxy/common';
import {
    Collection,
    MongoClient,
} from 'mongodb';
import {
    MongoDBStorage,
    Umzug,
} from 'umzug';
import { v4 as uuid } from 'uuid';
import migrations from './migrations';
import {
    CERTIFICATES_KEY,
    CONNECTORS_KEY,
    CREDENTIALS_KEY,
    FREEPROXIES_KEY,
    MIGRATIONS_KEY,
    PARAMS_KEY,
    PROJECTS_KEY,
    PROXIES_KEY,
    SOURCES_KEY,
    TASKS_KEY,
    USERS_KEY,
    WINDOWS_KEY,
} from './mongo.constants';
import {
    dropCollectionFailsafe,
    fromMongo,
    safeFromMongo,
} from './mongo.helpers';
import {
    CertificateNotFoundError,
    ConnectorNameAlreadyExistsError,
    ConnectorNotFoundError,
    CredentialNameAlreadyExistsError,
    CredentialNotFoundError,
    FreeproxiesNotFoundError,
    InconsistencyDataError,
    NoConnectorToRefreshError,
    NoProjectProxyError,
    NoProxyToRefreshError,
    NoSourceToRefreshError,
    NoTaskToRefreshError,
    ParamNotFoundError,
    ProjectNameAlreadyExistsError,
    ProjectNotFoundError,
    ProjectTokenNotFoundError,
    ProxiesNotFoundError,
    ProxyNotFoundError,
    SourceNotFoundError,
    TaskNotFoundError,
    UserEmailAlreadyExistsError,
    UserNotFoundByEmailError,
    UserNotFoundError,
} from '../../../errors';
import { LoggerAdapter } from '../../../helpers';
import { ProbeprovidersService } from '../../../probe';
import {
    CONNECTOR_DATA_META_MONGODB,
    CONNECTOR_SYNC_META_MONGODB,
    CONNECTOR_VIEW_META_MONGODB,
} from '../connector.model';
import {
    CREDENTIAL_DATA_META_MONGODB,
    CREDENTIAL_VIEW_META_MONGODB,
} from '../credential.model';
import {
    FREEPROXY_META_MONGODB,
    FREEPROXY_TO_REFRESH_META_MONGODB,
} from '../freeproxy.model';
import {
    PROJECT_DATA_META_MONGODB,
    PROJECT_METRICS_META_MONGODB,
    PROJECT_SYNC_META_MONGODB,
    PROJECT_VIEW_META_MONGODB,
} from '../project.model';
import {
    PROXY_DATA_META_MONGODB,
    PROXY_SYNC_META_MONGODB,
    PROXY_TO_CONNECT_META_MONGODB,
    PROXY_TO_REFRESH_META_MONGODB,
    PROXY_VIEW_META_MONGODB,
} from '../proxy.model';
import { SOURCE_META_MONGODB } from '../source.model';
import {
    TASK_DATA_META_MONGODB,
    TASK_VIEW_META_MONGODB,
} from '../task.model';
import {
    USER_DATA_META_MONGODB,
    USER_PROJECT_META_MONGODB,
} from '../user.model';
import type { IMongoConnection } from './mongo.interface';
import type { IProbeService } from '../../../probe';
import type { IStorageService } from '../../providers.interface';
import type { ICertificateModel } from '../certificate.model';
import type { IConnectorModel } from '../connector.model';
import type { ICredentialModel } from '../credential.model';
import type { IMongoConfig } from '../distributed.interface';
import type { IFreeproxyModel } from '../freeproxy.model';
import type { IParamModel } from '../param.model';
import type { IProjectModel } from '../project.model';
import type { IProxyModel } from '../proxy.model';
import type { ISourceModel } from '../source.model';
import type { ITaskModel } from '../task.model';
import type { IUserModel } from '../user.model';
import type { IWindowModel } from '../window.model';
import type {
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import type {
    ICertificate,
    ICertificateInfo,
    IConnectorData,
    IConnectorDataToCreate,
    IConnectorFreeproxyConfig,
    IConnectorProxiesSync,
    IConnectorProxiesView,
    IConnectorSync,
    IConnectorToRefresh,
    IConnectorView,
    ICredentialData,
    ICredentialView,
    IFreeproxy,
    IFreeproxyToRefresh,
    IProjectData,
    IProjectDataCreate,
    IProjectMetrics,
    IProjectMetricsAddView,
    IProjectMetricsView,
    IProjectSync,
    IProjectUserLink,
    IProjectView,
    IProxyData,
    IProxyMetricsAdd,
    IProxySync,
    IProxyToConnect,
    IProxyToRefresh,
    IProxyView,
    ISource,
    ISynchronizeFreeproxies,
    ISynchronizeLocalProxiesData,
    ITaskData,
    ITaskView,
    IUserData,
    IUserProject,
    IWindow,
} from '@scrapoxy/common';
import type { Filter } from 'mongodb';


export class StorageMongoService implements IStorageService, IProbeService, OnModuleInit, OnModuleDestroy {
    readonly type = 'mongo';

    alive = false;

    private readonly logger = new Logger(StorageMongoService.name);

    private colCertificates!: Collection<ICertificateModel>;

    private colConnector!: Collection<IConnectorModel>;

    private colCredentials!: Collection<ICredentialModel>;

    private colFreeproxies!: Collection<IFreeproxyModel>;

    private colParams!: Collection<IParamModel>;

    private colProjects!: Collection<IProjectModel>;

    private colProxies!: Collection<IProxyModel>;

    private colTasks!: Collection<ITaskModel>;

    private colSources!: Collection<ISourceModel>;

    private colUsers!: Collection<IUserModel>;

    private colWindows!: Collection<IWindowModel>;

    private readonly conn: IMongoConnection;

    constructor(
        client: MongoClient,
        config: IMongoConfig,
        probes: ProbeprovidersService
    ) {
        probes.register(this);

        this.conn = {
            config,
            client,
            db: client.db(config.db),
        };

        client.on(
            'serverHeartbeatSucceeded',
            () => {
                this.alive = true;
            }
        );

        client.on(
            'serverHeartbeatFailed',
            () => {
                this.alive = false;
            }
        );
    }

    async onModuleInit(): Promise<void> {
        // Migrate data if necessary
        const migrator = new Umzug({
            migrations,
            context: this.conn,
            storage: new MongoDBStorage({
                collection: this.conn.db.collection(MIGRATIONS_KEY),
            }),
            logger: new LoggerAdapter(this.logger),
        });
        await migrator.up();

        this.colCertificates = this.conn.db.collection(CERTIFICATES_KEY);
        this.colConnector = this.conn.db.collection(CONNECTORS_KEY);
        this.colCredentials = this.conn.db.collection(CREDENTIALS_KEY);
        this.colFreeproxies = this.conn.db.collection(FREEPROXIES_KEY);
        this.colParams = this.conn.db.collection(PARAMS_KEY);
        this.colProjects = this.conn.db.collection(PROJECTS_KEY);
        this.colProxies = this.conn.db.collection(PROXIES_KEY);
        this.colTasks = this.conn.db.collection(TASKS_KEY);
        this.colSources = this.conn.db.collection(SOURCES_KEY);
        this.colUsers = this.conn.db.collection(USERS_KEY);
        this.colWindows = this.conn.db.collection(WINDOWS_KEY);

        // Wait migration to finish before declaring the service as alive
        this.alive = true;
    }

    async onModuleDestroy(): Promise<void> {
        await this.conn.client.close();
    }

    async clean() {
        this.logger.debug('clean()');

        await Promise.all([
            dropCollectionFailsafe(
                this.conn.db,
                WINDOWS_KEY
            ),
            dropCollectionFailsafe(
                this.conn.db,
                USERS_KEY
            ),
            dropCollectionFailsafe(
                this.conn.db,
                TASKS_KEY
            ),
            dropCollectionFailsafe(
                this.conn.db,
                PROXIES_KEY
            ),
            dropCollectionFailsafe(
                this.conn.db,
                PROJECTS_KEY
            ),
            dropCollectionFailsafe(
                this.conn.db,
                PARAMS_KEY
            ),
            dropCollectionFailsafe(
                this.conn.db,
                MIGRATIONS_KEY
            ),
            dropCollectionFailsafe(
                this.conn.db,
                SOURCES_KEY
            ),
            dropCollectionFailsafe(
                this.conn.db,
                FREEPROXIES_KEY
            ),
            dropCollectionFailsafe(
                this.conn.db,
                CREDENTIALS_KEY
            ),
            dropCollectionFailsafe(
                this.conn.db,
                CONNECTORS_KEY
            ),
            dropCollectionFailsafe(
                this.conn.db,
                CERTIFICATES_KEY
            ),
        ]);
    }

    //////////// USERS ////////////
    async getUserById(userId: string): Promise<IUserData> {
        this.logger.debug(`getUserById(): userId=${userId}`);

        const userModel = await this.colUsers.findOne(
            {
                _id: userId,
            },
            {
                projection: USER_DATA_META_MONGODB,
            }
        )
            .then((u) => safeFromMongo<IUserData>(u));

        if (!userModel) {
            throw new UserNotFoundError(userId);
        }

        return toUserData(userModel);
    }

    async getUserByEmail(email: string): Promise<IUserData> {
        this.logger.debug(`getUserByEmail(): email=${email}`);

        const userModel = await this.colUsers.findOne(
            {
                email,
            },
            {
                projection: USER_DATA_META_MONGODB,
            }
        )
            .then((u) => safeFromMongo<IUserData>(u));

        if (!userModel) {
            throw new UserNotFoundByEmailError(email);
        }

        return toUserData(userModel);
    }

    async checkIfUserEmailExists(
        email: string, userId?: string
    ): Promise<void> {
        this.logger.debug(`checkIfUserEmailExists(): email=${email} / userId=${userId}`);

        const query: Filter<IUserModel> = {
            email,
        };

        if (userId) {
            query._id = {
                $ne: userId,
            };
        }

        const count = await this.colUsers.countDocuments(
            query,
            {
                limit: 1,
            }
        );

        if (count > 0) {
            throw new UserEmailAlreadyExistsError(email);
        }
    }

    async createUser(user: IUserData): Promise<void> {
        this.logger.debug(`createUser(): user.id=${user.id}`);

        const userModel: IUserModel = {
            _id: user.id,
            name: user.name,
            email: user.email,
            picture: user.picture,
            complete: user.complete,
            projectsIds: [],
        };

        await this.colUsers.insertOne(userModel);
    }

    async updateUser(user: IUserData): Promise<void> {
        this.logger.debug(`updateUser(): user.id=${user.id}`);

        const { matchedCount } = await this.colUsers.updateOne(
            {
                _id: user.id,
            },
            {
                $set: {
                    name: user.name,
                    email: user.email,
                    picture: user.picture,
                    complete: user.complete,
                },
            }
        );

        if (!matchedCount) {
            throw new UserNotFoundError(user.id);
        }
    }

    //////////// PROJECTS ////////////
    async getAllProjectsForUserId(userId: string): Promise<IProjectView[]> {
        this.logger.debug(`getAllProjectsForUserId(): userId=${userId}`);

        const projectsModel = await this.colProjects.find(
            {
                usersIds: userId,
            },
            {
                projection: PROJECT_VIEW_META_MONGODB,
            }
        )
            .map((p) => fromMongo<IProjectView>(p))
            .toArray();

        return projectsModel;
    }

    async getAllProjectsMetrics(): Promise<IProjectMetricsView[]> {
        this.logger.debug('getAllProjectMetrics()');

        const projectsModel = await this.colProjects.find(
            {},
            {
                projection: PROJECT_METRICS_META_MONGODB,
            }
        )
            .map((p) => fromMongo<IProjectMetrics>(p))
            .toArray();

        if (projectsModel.length <= 0) {
            return [];
        }

        const windowsModel = await this.colWindows.find()
            .map((w) => fromMongo<IWindow>(w))
            .toArray();
        const viewsMap = new Map<string, IProjectMetricsView>();
        for (const projectModel of projectsModel) {
            const view: IProjectMetricsView = {
                project: projectModel,
                windows: [],
            };
            viewsMap.set(
                projectModel.id,
                view
            );
        }

        for (const windowModel of windowsModel) {
            const projectModel = viewsMap.get(windowModel.projectId);

            if (!projectModel) {
                throw new InconsistencyDataError(`Window ${windowModel.id} references an unknown project ${windowModel.projectId}`);
            }

            projectModel.windows.push(windowModel);
        }

        return Array.from(viewsMap.values());
    }

    async getProjectById(projectId: string): Promise<IProjectData> {
        this.logger.debug(`getProjectById(): projectId=${projectId}`);

        const projectModel = await this.colProjects.findOne(
            {
                _id: projectId,
            },
            {
                projection: PROJECT_DATA_META_MONGODB,
            }
        )
            .then((p) => safeFromMongo<IProjectData>(p));

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        return projectModel;
    }

    async getProjectSyncById(projectId: string): Promise<IProjectSync> {
        this.logger.debug(`getProjectSyncById(): projectId=${projectId}`);

        const projectModel = await this.colProjects.findOne(
            {
                _id: projectId,
            },
            {
                projection: PROJECT_SYNC_META_MONGODB,
            }
        )
            .then((p) => safeFromMongo<IProjectSync>(p));

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        return projectModel;
    }

    async getProjectByToken(token: string): Promise<IProjectData> {
        this.logger.debug(`getProjectByToken(): token=${token}`);

        const projectModel = await this.colProjects.findOne(
            {
                token,
            },
            {
                projection: PROJECT_DATA_META_MONGODB,
            }
        )
            .then((p) => safeFromMongo<IProjectData>(p));

        if (!projectModel) {
            throw new ProjectTokenNotFoundError(token);
        }

        return projectModel;
    }

    async getProjectMetricsById(projectId: string): Promise<IProjectMetricsView> {
        this.logger.debug(`getProjectMetricsById(): projectId=${projectId}`);

        const projectModel = await this.colProjects.findOne(
            {
                _id: projectId,
            },
            {
                projection: PROJECT_METRICS_META_MONGODB,
            }
        )
            .then((p) => safeFromMongo<IProjectMetrics>(p));

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        const windowsModel = await this.colWindows.find({
            projectId,
        })
            .map((w) => fromMongo<IWindow>(w))
            .toArray();
        const view: IProjectMetricsView = {
            project: projectModel,
            windows: windowsModel,
        };

        return view;
    }

    async getProjectTokenById(projectId: string): Promise<string> {
        this.logger.debug(`getProjectTokenById(): projectId=${projectId}`);

        const projectModel = await this.colProjects.findOne(
            {
                _id: projectId,
            },
            {
                projection: {
                    token: 1,
                },
            }
        );

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        return projectModel.token;
    }

    async getProjectIdByToken(token: string): Promise<string> {
        this.logger.debug(`getProjectIdByToken(): token=${token}`);

        const projectModel = await this.colProjects.findOne(
            {
                token,
            },
            {
                projection: {
                    _id: 1,
                },
            }
        );

        if (!projectModel) {
            throw new ProjectNotFoundError(token);
        }

        return projectModel._id;
    }

    async getProjectConnectorsCountById(projectId: string): Promise<number> {
        this.logger.debug(`getProjectConnectorsCountById(): projectId=${projectId}`);

        const count = await this.colConnector.countDocuments({
            projectId,
        });

        return count;
    }

    async checkIfProjectNameExists(
        name: string, projectId?: string
    ): Promise<void> {
        this.logger.debug(`checkIfProjectNameExists(): name=${name} / projectId=${projectId}`);

        const query: Filter<IProjectModel> = {
            name,
        };

        if (projectId) {
            query._id = {
                $ne: projectId,
            };
        }

        const count = await this.colProjects.countDocuments(
            query,
            {
                limit: 1,
            }
        );

        if (count > 0) {
            throw new ProjectNameAlreadyExistsError(name);
        }
    }

    async createProject(create: IProjectDataCreate): Promise<void> {
        this.logger.debug(`createProject(): create.userId=${create.userId}, create.project.name=${create.project.name}`);

        const bulk = this.colWindows.initializeUnorderedBulkOp();

        for (const c of WINDOWS_CONFIG) {
            const windowModel: IWindowModel = {
                _id: uuid(),
                projectId: create.project.id,
                delay: c.delay,
                size: c.size,
                count: 0,
                requests: 0,
                stops: 0,
                bytesReceived: 0,
                bytesSent: 0,
                snapshots: [],
            };

            bulk.insert(windowModel);
        }

        const projectModel: IProjectModel = {
            _id: create.project.id,
            name: create.project.name,
            status: create.project.status,
            connectorDefaultId: create.project.connectorDefaultId,
            token: create.token,
            autoRotate: create.project.autoRotate,
            autoScaleUp: create.project.autoScaleUp,
            autoScaleDown: create.project.autoScaleDown,
            cookieSession: create.project.cookieSession,
            mitm: create.project.mitm,
            proxiesMin: create.project.proxiesMin,
            useragentOverride: create.project.useragentOverride,
            requests: 0,
            stops: 0,
            proxiesCreated: 0,
            proxiesRemoved: 0,
            bytesReceived: 0,
            bytesReceivedRate: 0,
            bytesSent: 0,
            bytesSentRate: 0,
            requestsBeforeStop: {
                sum: 0,
                count: 0,
            },
            uptimeBeforeStop: {
                sum: 0,
                count: 0,
            },
            snapshot: {
                requests: 0,
                stops: 0,
                bytesSent: 0,
                bytesReceived: 0,
            },
            usersIds: [
                create.userId,
            ],
            lastDataTs: Date.now(),
        };

        await Promise.all([
            this.colProjects.insertOne(projectModel), bulk.execute(),
        ]);
    }

    async updateProject(project: IProjectData): Promise<void> {
        this.logger.debug(`updateProject(): project.id=${project.id}`);

        const { matchedCount } = await this.colProjects.updateOne(
            {
                _id: project.id,
            },
            {
                $set: {
                    name: project.name,
                    autoRotate: project.autoRotate,
                    autoScaleUp: project.autoScaleUp,
                    autoScaleDown: project.autoScaleDown,
                    cookieSession: project.cookieSession,
                    mitm: project.mitm,
                    proxiesMin: project.proxiesMin,
                    useragentOverride: project.useragentOverride,
                    status: project.status,
                    connectorDefaultId: project.connectorDefaultId,
                },
            }
        );

        if (!matchedCount) {
            throw new ProjectNotFoundError(project.id);
        }
    }

    async updateProjectLastDataTs(
        projectId: string, lastDataTs: number
    ): Promise<void> {
        this.logger.debug(`updateProjectLastDataTs(): projectId=${projectId} / lastDataTs=${lastDataTs}`);

        const { matchedCount } = await this.colProjects.updateOne(
            {
                _id: projectId,
            },
            {
                $set: {
                    lastDataTs,
                },
            }
        );

        if (!matchedCount) {
            throw new ProjectNotFoundError(projectId);
        }
    }

    async removeProject(project: IProjectData): Promise<void> {
        this.logger.debug(`updateProject(): project.id=${project.id}`);

        const promiseProject = this.colProjects.deleteOne({
            _id: project.id,
        });
        const promiseConnectors = this.colConnector.deleteMany({
            projectId: project.id,
        });
        const promiseFreeproxies = this.colFreeproxies.deleteMany({
            projectId: project.id,
        });
        const promiseProxies = this.colProxies.deleteMany({
            projectId: project.id,
        });
        const promiseWindows = this.colWindows.deleteMany({
            projectId: project.id,
        });
        const [
            { deletedCount }, { deletedCount: deletedCount2 },
        ] = await Promise.all([
            promiseProject,
            promiseWindows,
            promiseConnectors,
            promiseFreeproxies,
            promiseProxies,
        ]);

        if (!deletedCount) {
            throw new ProjectNotFoundError(project.id);
        }

        if (!deletedCount2) {
            throw new InconsistencyDataError(`removeProject: Windows doesn't contains an existing project ${project.id}`);
        }
    }

    async getAllProjectUsersById(projectId: string): Promise<IUserProject[]> {
        this.logger.debug(`getAllProjectUsersById():projectId=${projectId}`);

        const projectModel = await this.colProjects.findOne(
            {
                _id: projectId,
            },
            {
                projection: {
                    usersIds: 1,
                },
            }
        );

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        const usersModel = await this.colUsers.find(
            {
                _id: {
                    $in: projectModel.usersIds,
                },
            },
            {
                projection: USER_PROJECT_META_MONGODB,
            }
        )
            .map((u) => fromMongo<IUserProject>(u))
            .toArray();

        return usersModel;
    }

    async canUserAccessToProject(
        projectId: string,
        userId: string
    ): Promise<boolean> {
        this.logger.debug(`canUserAccessToProject(): projectId=${projectId} / userId=${userId}`);

        const count = await this.colProjects.countDocuments(
            {
                _id: projectId,
                usersIds: userId,
            },
            {
                limit: 1,
            }
        );

        return count > 0;
    }

    async addUserToProject(link: IProjectUserLink): Promise<void> {
        this.logger.debug(`addUserToProject(): link.projectId=${link.projectId} / link.userId=${link.userId}`);

        const { matchedCount } = await this.colProjects.updateOne(
            {
                _id: link.projectId,
            },
            {
                $addToSet: {
                    usersIds: link.userId,
                },
            }
        );

        if (!matchedCount) {
            throw new ProjectNotFoundError(link.projectId);
        }
    }

    async removeUserFromProject(link: IProjectUserLink): Promise<void> {
        this.logger.debug(`removeUserFromProject(): link.projectId=${link.projectId} / link.userId=${link.userId}`);

        const { matchedCount } = await this.colProjects.updateOne(
            {
                _id: link.projectId,
            },
            {
                $pull: {
                    usersIds: link.userId,
                },
            }
        );

        if (!matchedCount) {
            throw new ProjectNotFoundError(link.projectId);
        }
    }

    async addProjectsMetrics(views: IProjectMetricsAddView[]): Promise<void> {
        this.logger.debug(`addProjectsMetrics(): views.length=${views.length}`);

        const
            bulkProjects = this.colProjects.initializeUnorderedBulkOp(),
            bulkWindows = this.colWindows.initializeUnorderedBulkOp();
        let updateWindows = false;

        for (const view of views) {
            const
                $inc: any = {},
                $max: any = {},
                $min: any = {},
                $set: any = {};

            if (view.project.requests) {
                $inc.requests = view.project.requests;
            }

            if (view.project.stops) {
                $inc.stops = view.project.stops;
            }

            if (view.project.proxiesCreated) {
                $inc.proxiesCreated = view.project.proxiesCreated;
            }

            if (view.project.proxiesRemoved) {
                $inc.proxiesRemoved = view.project.proxiesRemoved;
            }

            if (view.project.bytesReceived) {
                $inc.bytesReceived = view.project.bytesReceived;
                $set.bytesReceivedRate = view.project.bytesReceived;
            }

            if (view.project.bytesSent) {
                $inc.bytesSent = view.project.bytesSent;
                $set.bytesSentRate = view.project.bytesSent;
            }

            if (view.project.snapshot) {
                $inc[ 'snapshot.requests' ] = view.project.snapshot.requests;
                $inc[ 'snapshot.stops' ] = view.project.snapshot.stops;
                $inc[ 'snapshot.bytesReceived' ] = view.project.snapshot.bytesReceived;
                $inc[ 'snapshot.bytesSent' ] = view.project.snapshot.bytesSent;
            }

            if (view.project.requestsBeforeStop) {
                $inc[ 'requestsBeforeStop.sum' ] = view.project.requestsBeforeStop.sum;
                $inc[ 'requestsBeforeStop.count' ] = view.project.requestsBeforeStop.count;

                if (view.project.requestsBeforeStop.min != null) {
                    $min[ 'requestsBeforeStop.min' ] = view.project.requestsBeforeStop.min;
                }

                if (view.project.requestsBeforeStop.max != null) {
                    $max[ 'requestsBeforeStop.max' ] = view.project.requestsBeforeStop.max;
                }
            }

            if (view.project.uptimeBeforeStop) {
                $inc[ 'uptimeBeforeStop.sum' ] = view.project.uptimeBeforeStop.sum;
                $inc[ 'uptimeBeforeStop.count' ] = view.project.uptimeBeforeStop.count;

                if (view.project.uptimeBeforeStop.min != null) {
                    $min[ 'uptimeBeforeStop.min' ] = view.project.uptimeBeforeStop.min;
                }

                if (view.project.uptimeBeforeStop.max != null) {
                    $max[ 'uptimeBeforeStop.max' ] = view.project.uptimeBeforeStop.max;
                }
            }

            const updateDocumentProject: any = {};

            if (Object.keys($inc).length > 0) {
                updateDocumentProject.$inc = $inc;
            }

            if (Object.keys($min).length > 0) {
                updateDocumentProject.$min = $min;
            }

            if (Object.keys($max).length > 0) {
                updateDocumentProject.$max = $max;
            }

            if (Object.keys($set).length > 0) {
                updateDocumentProject.$set = $set;
            }

            if (Object.keys(updateDocumentProject).length > 0) {
                bulkProjects.find({
                    _id: view.project.id,
                })
                    .updateOne(updateDocumentProject);
            }

            if (view.windows) {
                for (const window of view.windows) {
                    const updateDocumentWindow: any = {
                        $inc: {
                            count: window.count,
                            requests: window.requests,
                            stops: window.stops,
                            bytesReceived: window.bytesReceived,
                            bytesSent: window.bytesSent,
                        },
                    };

                    if (window.snapshot) {
                        updateDocumentWindow.$push = {
                            snapshots: {
                                $each: [
                                    window.snapshot,
                                ],
                                $slice: window.size,
                            },
                        };
                    }

                    updateWindows = true;
                    bulkWindows.find({
                        _id: window.id,
                        projectId: window.projectId,
                    })
                        .updateOne(updateDocumentWindow);
                }
            }
        }

        const promises: Promise<any>[] = [];

        try {
            promises.push(bulkProjects.execute());

            if (updateWindows) {
                promises.push(bulkWindows.execute());
            }
        } finally {
            await Promise.all(promises);
        }
    }

    async updateProjectToken(
        projectId: string, token: string
    ): Promise<void> {
        this.logger.debug(`updateProjectToken(): projectId=${projectId}`);

        const { matchedCount } = await this.colProjects.updateOne(
            {
                _id: projectId,
            },
            {
                $set: {
                    token,
                },
            }
        );

        if (!matchedCount) {
            throw new ProjectNotFoundError(projectId);
        }
    }

    //////////// CREDENTIALS ////////////
    async getAllProjectCredentials(
        projectId: string, type: string | null
    ): Promise<ICredentialView[]> {
        this.logger.debug(`getAllProjectCredentials(): projectId=${projectId} / type=${type}`);

        const query: Filter<ICredentialModel> = {
            projectId,
        };

        if (type) {
            query.type = type;
        }

        const credentialsModel = await this.colCredentials.find(
            query,
            {
                projection: CREDENTIAL_VIEW_META_MONGODB,
            }
        )
            .map((c) => fromMongo<ICredentialView>(c))
            .toArray();

        return credentialsModel;
    }

    async getAllProjectCredentialsNames(projectId: string): Promise<string[]> {
        this.logger.debug(`getAllProjectCredentialsNames(): projectId=${projectId}`);

        const names = await this.colCredentials.find(
            {
                projectId,
            },
            {
                projection: {
                    name: 1,
                },
            }
        )
            .map((c) => c.name)
            .toArray();

        return names;
    }

    async getCredentialById(
        projectId: string, credentialId: string
    ): Promise<ICredentialData> {
        this.logger.debug(`getCredentialById(): projectId=${projectId} / credentialId=${credentialId}`);

        const credentialModel = await this.colCredentials.findOne(
            {
                _id: credentialId,
                projectId,
            },
            {
                projection: CREDENTIAL_DATA_META_MONGODB,
            }
        )
            .then((c) => safeFromMongo<ICredentialData>(c));

        if (!credentialModel) {
            throw new CredentialNotFoundError(
                projectId,
                credentialId
            );
        }

        return credentialModel;
    }

    async getCredentialConnectorsCountById(
        projectId: string, credentialId: string, active: boolean
    ): Promise<number> {
        this.logger.debug(`getCredentialConnectorsCountById(): projectId=${projectId} / credentialId=${credentialId} / active=${active}`);

        const query: Filter<IConnectorModel> = {
            credentialId,
            projectId,
        };

        if (active) {
            query.active = active;
        }

        const count = await this.colConnector.countDocuments(query);

        return count;
    }

    async checkIfCredentialNameExists(
        projectId: string, name: string, credentialId?: string
    ): Promise<void> {
        this.logger.debug(`checkIfCredentialNameExists(): projectId=${projectId} / name=${name} / credentialId=${credentialId}`);

        const query: Filter<ICredentialModel> = {
            projectId,
            name,
        };

        if (credentialId) {
            query._id = {
                $ne: credentialId,
            };
        }

        const count = await this.colCredentials.countDocuments(
            query,
            {
                limit: 1,
            }
        );

        if (count > 0) {
            throw new CredentialNameAlreadyExistsError(
                projectId,
                name
            );
        }
    }

    async createCredential(credential: ICredentialData): Promise<void> {
        this.logger.debug(`createCredential(): credential.id=${credential.id}`);

        const credentialModel: ICredentialModel = {
            _id: credential.id,
            projectId: credential.projectId,
            name: credential.name,
            type: credential.type,
            config: credential.config,
        };

        await this.colCredentials.insertOne(credentialModel);
    }

    async updateCredential(credential: ICredentialData): Promise<void> {
        this.logger.debug(`updateCredential(): credential.id=${credential.id}`);

        const { matchedCount } = await this.colCredentials.updateOne(
            {
                _id: credential.id,
                projectId: credential.projectId,
            },
            {
                $set: {
                    name: credential.name,
                    config: credential.config,
                },
            }
        );

        if (!matchedCount) {
            throw new CredentialNotFoundError(
                credential.projectId,
                credential.id
            );
        }
    }

    async removeCredential(credential: ICredentialData): Promise<void> {
        this.logger.debug(`removeCredential(): credential.id=${credential.id}`);

        const { deletedCount } = await this.colCredentials.deleteOne({
            _id: credential.id,
            projectId: credential.projectId,
        });

        if (!deletedCount) {
            throw new CredentialNotFoundError(
                credential.projectId,
                credential.id
            );
        }
    }

    //////////// CONNECTORS ////////////
    async getAllProjectConnectorsAndProxiesById(projectId: string): Promise<IConnectorProxiesView[]> {
        this.logger.debug(`getAllProjectConnectorsAndProxiesById(): projectId=${projectId}`);

        const promiseConnectors = this.colConnector.find(
            {
                projectId,
            },
            {
                projection: CONNECTOR_VIEW_META_MONGODB,
            }
        )
            .map((c) => fromMongo<IConnectorView>(c))
            .toArray();
        const promiseProxies = this.colProxies.find(
            {
                projectId,
            },
            {
                projection: PROXY_VIEW_META_MONGODB,
            }
        )
            .map((p) => fromMongo<IProxyView>(p))
            .toArray();
        const [
            connectorsModel, proxiesModel,
        ] = await Promise.all([
            promiseConnectors, promiseProxies,
        ]);
        const connectorsMap = new Map<string, IConnectorProxiesView>();
        for (const connectorModel of connectorsModel) {
            const cp: IConnectorProxiesView = {
                connector: connectorModel,
                proxies: [],
            };

            connectorsMap.set(
                connectorModel.id,
                cp
            );
        }

        for (const proxyModel of proxiesModel) {
            const cp = connectorsMap.get(proxyModel.connectorId);

            if (cp) {
                cp.proxies.push(proxyModel);
            }
        }

        return Array.from(connectorsMap.values());
    }

    async getAllProjectConnectorsNames(projectId: string): Promise<string[]> {
        this.logger.debug(`getAllProjectConnectorsNames(): projectId=${projectId}`);

        const names = await this.colConnector.find(
            {
                projectId,
            },
            {
                projection: {
                    name: 1,
                },
            }
        )
            .map((c) => c.name)
            .toArray();

        return names;
    }

    async getAllConnectorProxiesById(
        projectId: string, connectorId: string
    ): Promise<IConnectorProxiesView> {
        this.logger.debug(`getAllConnectorProxiesById(): projectId=${projectId} / connectorId=${connectorId}`);

        const connectorModel = await this.colConnector.findOne(
            {
                _id: connectorId,
                projectId,
            },
            {
                projection: CONNECTOR_VIEW_META_MONGODB,
            }
        )
            .then((c) => safeFromMongo<IConnectorView>(c));

        if (!connectorModel) {
            throw new ConnectorNotFoundError(
                projectId,
                connectorId
            );
        }

        const proxiesModel = await this.colProxies.find(
            {
                connectorId: connectorId,
                projectId,
            },
            {
                projection: PROXY_VIEW_META_MONGODB,
            }
        )
            .map((p) => fromMongo<IProxyView>(p))
            .toArray();
        const cp: IConnectorProxiesView = {
            connector: connectorModel,
            proxies: proxiesModel,
        };

        return cp;
    }

    async getAllConnectorProxiesSyncById(
        projectId: string, connectorId: string
    ): Promise<IConnectorProxiesSync> {
        this.logger.debug(`getAllConnectorProxiesSyncById(): projectId=${projectId} / connectorId=${connectorId}`);

        const connectorModel = await this.colConnector.findOne(
            {
                _id: connectorId,
                projectId,
            },
            {
                projection: CONNECTOR_SYNC_META_MONGODB,
            }
        )
            .then((c) => safeFromMongo<IConnectorSync>(c));

        if (!connectorModel) {
            throw new ConnectorNotFoundError(
                projectId,
                connectorId
            );
        }

        const proxiesModel = await this.colProxies.find(
            {
                connectorId: connectorId,
                projectId,
            },
            {
                projection: PROXY_SYNC_META_MONGODB,
            }
        )
            .map((p) => fromMongo<IProxySync>(p))
            .toArray();
        const cp: IConnectorProxiesSync = {
            connector: connectorModel,
            proxies: proxiesModel,
        };

        return cp;
    }

    async getConnectorById(
        projectId: string, connectorId: string
    ): Promise<IConnectorData> {
        this.logger.debug(`getConnectorById(): projectId=${projectId} / connectorId=${connectorId}`);

        const connectorModel = await this.colConnector.findOne(
            {
                _id: connectorId,
                projectId,
            },
            {
                projection: CONNECTOR_DATA_META_MONGODB,
            }
        )
            .then((c) => safeFromMongo<IConnectorData>(c));

        if (!connectorModel) {
            throw new ConnectorNotFoundError(
                projectId,
                connectorId
            );
        }

        return connectorModel;
    }

    async getAnotherConnectorById(
        projectId: string, excludeConnectorId: string
    ): Promise<string | null> {
        this.logger.debug(`getAnotherConnectorById(): projectId=${projectId} / excludeConnectorId=${excludeConnectorId}`);

        const connectorModel = await this.colConnector.findOne(
            {
                _id: {
                    $ne: excludeConnectorId,
                },
                projectId,
            },
            {
                projection: {
                    _id: 1,
                },
            }
        );

        if (!connectorModel) {
            return null;
        }

        return connectorModel._id;
    }

    async getConnectorCertificateById(
        projectId: string, connectorId: string
    ): Promise<ICertificate | null> {
        this.logger.debug(`getConnectorCertificateById(): projectId=${projectId} / connectorId=${connectorId}`);

        const connectorModel = await this.colConnector.findOne(
            {
                _id: connectorId,
                projectId,
            },
            {
                projection: {
                    certificate: 1,
                },
            }
        );

        if (!connectorModel) {
            throw new ConnectorNotFoundError(
                projectId,
                connectorId
            );
        }

        return connectorModel.certificate;
    }

    async checkIfConnectorNameExists(
        projectId: string, name: string, connectorId?: string
    ): Promise<void> {
        this.logger.debug(`checkIfConnectorNameExists(): projectId=${projectId} / name=${name} / connectorId=${connectorId}`);

        const query: Filter<IConnectorModel> = {
            projectId,
            name,
        };

        if (connectorId) {
            query._id = {
                $ne: connectorId,
            };
        }

        const count = await this.colConnector.countDocuments(
            query,
            {
                limit: 1,
            }
        );

        if (count > 0) {
            throw new ConnectorNameAlreadyExistsError(
                projectId,
                name
            );
        }
    }

    async createConnector(connector: IConnectorDataToCreate): Promise<void> {
        this.logger.debug(`createConnector(): connector.id=${connector.id}`);

        const connectorModel: IConnectorModel = {
            _id: connector.id,
            projectId: connector.projectId,
            name: connector.name,
            type: connector.type,
            active: connector.active,
            proxiesMax: connector.proxiesMax,
            proxiesTimeoutDisconnected: connector.proxiesTimeoutDisconnected,
            proxiesTimeoutUnreachable: connector.proxiesTimeoutUnreachable,
            error: connector.error,
            certificateEndAt: connector.certificateEndAt,
            config: connector.config,
            credentialId: connector.credentialId,
            nextRefreshTs: Date.now(),
            certificate: connector.certificate,
        };

        await this.colConnector.insertOne(connectorModel);
    }

    async updateConnector(connector: IConnectorData): Promise<void> {
        this.logger.debug(`updateConnector(): connector.id=${connector.id}`);

        const connectorPromise = this.colConnector.updateOne(
            {
                _id: connector.id,
                projectId: connector.projectId,
            },
            {
                $set: {
                    name: connector.name,
                    active: connector.active,
                    proxiesMax: connector.proxiesMax,
                    proxiesTimeoutDisconnected: connector.proxiesTimeoutDisconnected,
                    proxiesTimeoutUnreachable: connector.proxiesTimeoutUnreachable,
                    error: connector.error,
                    certificateEndAt: connector.certificateEndAt,
                    credentialId: connector.credentialId,
                    config: connector.config,
                },
            }
        );
        const proxiesPromise = this.colProxies.updateMany(
            {
                connectorId: connector.id,
                projectId: connector.projectId,
            },
            {
                $set: {
                    timeoutDisconnected: connector.proxiesTimeoutDisconnected,
                    timeoutUnreachable: toOptionalValue(connector.proxiesTimeoutUnreachable),
                },
            }
        );
        let freeproxiesPromises: Promise<any>;

        if (connector.type === CONNECTOR_FREEPROXIES_TYPE) {
            const config = connector.config as IConnectorFreeproxyConfig;
            freeproxiesPromises = this.colFreeproxies.updateMany(
                {
                    connectorId: connector.id,
                    projectId: connector.projectId,
                },
                {
                    $set: {
                        timeoutDisconnected: config.freeproxiesTimeoutDisconnected,
                        timeoutUnreachable: toOptionalValue(config.freeproxiesTimeoutUnreachable),
                    },
                }
            );
        } else {
            freeproxiesPromises = Promise.resolve();
        }

        const [
            { matchedCount },
        ] = await Promise.all([
            connectorPromise, proxiesPromise, freeproxiesPromises,
        ]);

        if (!matchedCount) {
            throw new ConnectorNotFoundError(
                connector.projectId,
                connector.id
            );
        }
    }

    async updateConnectorCertificate(
        projectId: string,
        connectorId: string,
        certificateInfo: ICertificateInfo
    ): Promise<void> {
        this.logger.debug(`updateConnectorCertificate(): projectId=${projectId} / connectorId=${connectorId}`);

        const { matchedCount } = await this.colConnector.updateOne(
            {
                _id: connectorId,
                projectId: projectId,
            },
            {
                $set: {
                    certificate: certificateInfo.certificate,
                    certificateEndAt: certificateInfo.endAt,
                },
            }
        );

        if (!matchedCount) {
            throw new ConnectorNotFoundError(
                projectId,
                connectorId
            );
        }
    }

    async removeConnector(connector: IConnectorData): Promise<void> {
        this.logger.debug(`removeConnector(): connector.id=${connector.id}`);

        const promiseConnectors = this.colConnector.deleteOne({
            _id: connector.id,
            projectId: connector.projectId,
        });
        const promiseFreeproxies = this.colFreeproxies.deleteMany({
            connectorId: connector.id,
            projectId: connector.projectId,
        });
        const promiseProxies = this.colProxies.deleteMany({
            connectorId: connector.id,
            projectId: connector.projectId,
        });
        const [
            { deletedCount },
        ] = await Promise.all([
            promiseConnectors, promiseFreeproxies, promiseProxies,
        ]);

        if (deletedCount <= 0) {
            throw new ConnectorNotFoundError(
                connector.projectId,
                connector.id
            );
        }
    }

    async getNextConnectorToRefresh(nextRefreshTs: number): Promise<IConnectorToRefresh> {
        this.logger.debug(`getNextConnectorToRefresh(): nextRefreshTs=${nextRefreshTs}`);

        const connectorModel = await this.colConnector.findOne(
            {
                nextRefreshTs: {
                    $lt: nextRefreshTs,
                },
            },
            {
                sort: {
                    nextRefreshTs: 1,
                },
                limit: 1,
                projection: {
                    _id: 1,
                    name: 1,
                    projectId: 1,
                    credentialId: 1,
                    type: 1,
                    proxiesMax: 1,
                    error: 1,
                    config: 1,
                    certificate: 1,
                },
            }
        );

        if (!connectorModel) {
            throw new NoConnectorToRefreshError();
        }

        const promiseProxiesKeys = this.colProxies.find(
            {
                connectorId: connectorModel._id,
                projectId: connectorModel.projectId,
            },
            {
                projection: {
                    _id: 0,
                    key: 1,
                },
            }
        )
            .map((p) => p.key)
            .toArray();
        const promiseCredential = this.colCredentials.findOne(
            {
                _id: connectorModel.credentialId,
                projectId: connectorModel.projectId,
            },
            {
                projection: {
                    _id: 0,
                    config: 1,
                },
            }
        );
        const [
            proxiesKeys, credential,
        ] = await Promise.all([
            promiseProxiesKeys, promiseCredential,
        ]);

        if (!credential) {
            throw new CredentialNotFoundError(
                connectorModel.projectId,
                connectorModel.credentialId
            );
        }

        const refresh: IConnectorToRefresh = {
            id: connectorModel._id,
            name: connectorModel.name,
            projectId: connectorModel.projectId,
            type: connectorModel.type,
            proxiesMax: connectorModel.proxiesMax,
            error: connectorModel.error,
            credentialConfig: credential.config,
            connectorConfig: connectorModel.config,
            certificate: connectorModel.certificate,
            proxiesKeys,
        };

        return refresh;
    }

    async updateConnectorNextRefreshTs(
        projectId: string, connectorId: string, nextRefreshTs: number
    ): Promise<void> {
        this.logger.debug(`updateConnectorNextRefreshTs(): projectId=${projectId} / connectorId=${connectorId} / nextRefreshTs=${nextRefreshTs}`);

        const { modifiedCount } = await this.colConnector.updateOne(
            {
                _id: connectorId,
                projectId: projectId,
            },
            {
                $set: {
                    nextRefreshTs,
                },
            }
        );

        if (modifiedCount <= 0) {
            throw new ConnectorNotFoundError(
                projectId,
                connectorId
            );
        }
    }

    //////////// PROXIES ////////////
    async getProxiesByIds(proxiesIds: string[]): Promise<IProxyData[]> {
        this.logger.debug(`getProxiesByIds(): proxiesIds.length=${proxiesIds.length}`);

        const query: Filter<IProxyModel> = {
            _id: {
                $in: proxiesIds,
            },
        };
        const proxiesModel = await this.colProxies.find(
            query,
            {
                projection: PROXY_DATA_META_MONGODB,
            }
        )
            .map((p) => fromMongo<IProxyData>(p))
            .toArray();

        return proxiesModel;
    }

    async getProjectProxiesByIds(
        projectId: string, proxiesIds: string[], removing?: boolean
    ): Promise<IProxyData[]> {
        this.logger.debug(`getProjectProxiesByIds(): projectId=${projectId} / proxiesIds.length=${proxiesIds.length} / removing=${removing}`);

        const query: Filter<IProxyModel> = {
            _id: {
                $in: proxiesIds,
            },
            projectId,
        };

        if (removing === false || removing === true) {
            query.removing = removing;
        }

        const proxiesModel = await this.colProxies.find(
            query,
            {
                projection: PROXY_DATA_META_MONGODB,
            }
        )
            .map((p) => fromMongo<IProxyData>(p))
            .toArray();

        return proxiesModel;
    }

    async getConnectorProxiesCountById(
        projectId: string, connectorId: string
    ): Promise<number> {
        this.logger.debug(`getConnectorProxiesCountById(): projectId=${projectId} / connectorId=${connectorId}`);

        const count = await this.colProxies.countDocuments({
            projectId,
            connectorId,
        });

        return count;

    }

    async getProxiesCount(): Promise<number> {
        const count = await this.colProxies.countDocuments();

        return count;
    }

    async synchronizeProxies(actions: ISynchronizeLocalProxiesData): Promise<void> {
        this.logger.debug(`synchronizeProxies(): created.length=${actions.created.length} / updated.length=${actions.updated.length} / removed.length=${actions.removed.length}`);

        const bulk = this.colProxies.initializeUnorderedBulkOp();
        for (const proxy of actions.created) {
            const proxyModel: IProxyModel = {
                _id: proxy.id,
                connectorId: proxy.connectorId,
                projectId: proxy.projectId,
                type: proxy.type,
                key: proxy.key,
                name: proxy.name,
                config: proxy.config,
                status: proxy.status,
                removing: proxy.removing,
                removingForce: proxy.removingForce,
                createdTs: proxy.createdTs,
                fingerprint: proxy.fingerprint,
                fingerprintError: proxy.fingerprintError,
                useragent: proxy.useragent,
                timeoutDisconnected: proxy.timeoutDisconnected,
                timeoutUnreachable: proxy.timeoutUnreachable,
                disconnectedTs: proxy.disconnectedTs,
                autoRotateDelayFactor: proxy.autoRotateDelayFactor,
                requests: 0,
                bytesSent: 0,
                bytesReceived: 0,
                nextRefreshTs: 0,
                lastConnectionTs: 0,
            };

            this.logger.debug(`synchronizeProxies: create proxy ${proxyModel._id}`);

            bulk.insert(proxyModel);
        }

        for (const proxy of actions.updated) {
            this.logger.debug(`synchronizeProxies: update proxy ${proxy.id}`);

            bulk.find({
                _id: proxy.id,
            })
                .updateOne({
                    $set: {
                        //connectorId => not modified
                        //projectId => not modified
                        //key => not modified
                        //name => not modified
                        status: proxy.status,
                        config: proxy.config,
                        // useragent => not modified
                        timeoutDisconnected: proxy.timeoutDisconnected,
                        timeoutUnreachable: proxy.timeoutUnreachable,
                        // createdTs => not modified
                        removing: proxy.removing,
                        removingForce: proxy.removingForce,
                        fingerprint: proxy.fingerprint,
                        fingerprintError: proxy.fingerprintError,
                        disconnectedTs: proxy.disconnectedTs,
                    },
                });
        }

        for (const proxy of actions.removed) {
            this.logger.debug(`synchronizeProxies: remove proxy ${proxy.id}`);

            bulk.find({
                _id: proxy.id,
            })
                .deleteOne();
        }

        await bulk.execute();
    }

    async addProxiesMetrics(proxies: IProxyMetricsAdd[]): Promise<void> {
        this.logger.debug(`addProxiesMetrics(): proxies.length=${proxies.length}`);

        const
            bulkProjects = this.colProjects.initializeUnorderedBulkOp(),
            bulkProxies = this.colProxies.initializeUnorderedBulkOp(),
            nowTime = Date.now();
        const projectsMetrics = new Map<string, {
            bytesReceived: number;
            bytesSent: number;
            requests: number;
        }>();

        for (const proxy of proxies) {
            let projectMetrics = projectsMetrics.get(proxy.projectId);

            if (projectMetrics) {
                projectMetrics.bytesReceived += proxy.bytesReceived;
                projectMetrics.bytesSent += proxy.bytesSent;
                projectMetrics.requests += proxy.requests;
            } else {
                projectMetrics = {
                    bytesReceived: proxy.bytesReceived,
                    bytesSent: proxy.bytesSent,
                    requests: proxy.requests,
                };
                projectsMetrics.set(
                    proxy.projectId,
                    projectMetrics
                );
            }

            bulkProxies.find({
                _id: proxy.id,
            })
                .updateOne({
                    $inc: {
                        requests: proxy.requests,
                        bytesReceived: proxy.bytesReceived,
                        bytesSent: proxy.bytesSent,
                    },
                });
        }

        for (const [
            projectId, projectMetrics,
        ] of projectsMetrics.entries()) {
            bulkProjects.find({
                _id: projectId,
            })
                .updateOne({
                    $inc: {
                        'snapshot.bytesReceived': projectMetrics.bytesReceived,
                        'snapshot.bytesSent': projectMetrics.bytesSent,
                        'snapshot.requests': projectMetrics.requests,
                    },
                    $set: {
                        lastDataTs: nowTime,
                    },
                });
        }

        await Promise.all([
            bulkProjects.execute(), bulkProxies.execute(),
        ]);
    }

    async getNextProxyToConnect(
        projectId: string,
        proxyname: string | null
    ): Promise<IProxyToConnect> {
        this.logger.debug(`getNextProxyToConnect(): projectId=${projectId} / proxyname=${proxyname}`);

        const query: Filter<IProxyModel> = {
            projectId,
            status: EProxyStatus.STARTED,
            fingerprint: {
                $ne: null,
            },
            removing: false,
        };

        if (proxyname) {
            query._id = proxyname;
        }

        const proxyModel = await this.colProxies.findOne(
            query,
            {
                sort: {
                    lastConnectionTs: 1,
                },
                limit: 1,
                projection: PROXY_TO_CONNECT_META_MONGODB,
            }
        )
            .then((p) => safeFromMongo<IProxyToConnect>(p));

        if (!proxyModel) {
            throw new NoProjectProxyError(projectId);
        }

        return proxyModel;
    }

    async updateProxyLastConnectionTs(
        projectId: string, connectorId: string, proxyId: string, lastConnectionTs: number
    ): Promise<void> {
        this.logger.debug(`updateProxyLastConnectionTs(): projectId=${projectId} / connectorId=${connectorId} / proxyId=${proxyId} / lastConnectionTs=${lastConnectionTs}`);

        const { modifiedCount } = await this.colProxies.updateOne(
            {
                _id: proxyId,
                projectId,
                connectorId,
            },
            {
                $set: {
                    lastConnectionTs,
                },
            }
        );

        if (modifiedCount <= 0) {
            throw new ProxyNotFoundError(
                projectId,
                connectorId,
                proxyId
            );
        }
    }

    async getNextProxiesToRefresh(
        nextRefreshTs: number, count: number
    ): Promise<IProxyToRefresh[]> {
        this.logger.debug(`getNextProxiesToRefresh(): nextRefreshTs=${nextRefreshTs} / count=${count}`);

        const proxiesModel = await this.colProxies.find(
            {
                status: EProxyStatus.STARTED,
                nextRefreshTs: {
                    $lt: nextRefreshTs,
                },
            },
            {
                sort: {
                    nextRefreshTs: 1,
                },
                limit: count,
                projection: PROXY_TO_REFRESH_META_MONGODB,
            }
        )
            .map((p) => fromMongo<IProxyToRefresh>(p))
            .toArray();

        if (proxiesModel.length <= 0) {
            throw new NoProxyToRefreshError();
        }

        return proxiesModel;
    }

    async updateProxiesNextRefreshTs(
        proxiesIds: string[], nextRefreshTs: number
    ): Promise<void> {
        this.logger.debug(`updateProxiesNextRefreshTs(): proxiesIds.length=${proxiesIds.length} / nextRefreshTs=${nextRefreshTs}`);


        const { modifiedCount } = await this.colProxies.updateMany(
            {
                _id: {
                    $in: proxiesIds,
                },
            },
            [
                {
                    $set: {
                        nextRefreshTs: {
                            $add: [
                                nextRefreshTs, '$timeoutDisconnected',
                            ],
                        },
                    },
                },
            ]
        );

        if (modifiedCount !== proxiesIds.length) {
            const idsFound = await this.colProxies.find(
                {
                    _id: {
                        $in: proxiesIds,
                    },
                },
                {
                    projection: {
                        _id: 1,
                    },
                }
            )
                .map((p) => p._id)
                .toArray();
            const idsNotFound = proxiesIds.filter((id) => !idsFound.includes(id));

            throw new ProxiesNotFoundError(idsNotFound);
        }
    }

    //////////// FREE PROXIES ////////////
    async getFreeproxiesByIds(freeproxiesIds: string[]): Promise<IFreeproxy[]> {
        this.logger.debug(`getFreeproxiesByIds(): freeproxiesIds.length=${freeproxiesIds.length}`);

        const freeproxies = await this.colFreeproxies.find(
            {
                _id: {
                    $in: freeproxiesIds,
                },
            },
            {
                projection: FREEPROXY_META_MONGODB,
            }
        )
            .map((p) => fromMongo<IFreeproxy>(p))
            .toArray();

        return freeproxies;
    }

    async getAllProjectFreeproxiesById(
        projectId: string, connectorId: string
    ): Promise<IFreeproxy[]> {
        this.logger.debug(`getAllProjectFreeproxiesById(): projectId=${projectId} / connectorId=${connectorId}`);

        const freeproxies = await this.colFreeproxies.find(
            {
                projectId,
                connectorId,
            },
            {
                projection: FREEPROXY_META_MONGODB,
            }
        )
            .map((p) => fromMongo<IFreeproxy>(p))
            .toArray();

        return freeproxies;
    }

    async getSelectedProjectFreeproxies(
        projectId: string, connectorId: string, keys: string[]
    ): Promise<IFreeproxy[]> {
        this.logger.debug(`getSelectedProjectFreeproxies(): projectId=${projectId} / connectorId=${connectorId} / keys.length=${keys.length}`);

        const freeproxies = await this.colFreeproxies.find(
            {
                projectId,
                connectorId,
                key: {
                    $in: keys,
                },
            },
            {
                projection: FREEPROXY_META_MONGODB,
            }
        )
            .map((p) => fromMongo<IFreeproxy>(p))
            .toArray();

        return freeproxies;
    }

    async getNewProjectFreeproxies(
        projectId: string, connectorId: string, count: number, excludeKeys: string[]
    ): Promise<IFreeproxy[]> {
        this.logger.debug(`getNewProjectFreeproxies(): projectId=${projectId} / connectorId=${connectorId} / count=${count} / excludeKeys.length=${excludeKeys.length}`);

        const freeproxies = await this.colFreeproxies.find(
            {
                projectId,
                connectorId,
                key: {
                    $nin: excludeKeys,
                },
                fingerprint: {
                    $ne: null,
                },
            },
            {
                limit: count,
                projection: FREEPROXY_META_MONGODB,
            }
        )
            .map((p) => fromMongo<IFreeproxy>(p))
            .toArray();

        return freeproxies;
    }

    async createFreeproxies(
        projectId: string,
        connectorId: string,
        freeproxies: IFreeproxy[]
    ): Promise<void> {
        this.logger.debug(`createFreeproxies(): projectId=${projectId} / connectorId=${connectorId} / freeproxies.length=${freeproxies.length}`);

        const connectorModel = await this.colConnector.findOne(
            {
                _id: connectorId,
                projectId,
            },
            {
                projection: {
                    proxiesTimeoutDisconnected: 1,
                    proxiesTimeoutUnreachable: 1,
                },
            }
        );

        if (!connectorModel) {
            throw new ConnectorNotFoundError(
                projectId,
                connectorId
            );
        }

        const bulk = this.colFreeproxies.initializeUnorderedBulkOp();
        for (const freeproxy of freeproxies) {
            if (freeproxy.projectId !== projectId ||
                freeproxy.connectorId !== connectorId) {
                continue;
            }

            const freeproxyToCreate: IFreeproxyModel = {
                _id: freeproxy.id,
                projectId: freeproxy.projectId,
                connectorId: freeproxy.connectorId,
                type: freeproxy.type,
                key: freeproxy.key,
                address: freeproxy.address,
                auth: freeproxy.auth,
                disconnectedTs: freeproxy.disconnectedTs,
                fingerprint: null,
                fingerprintError: null,
                timeoutDisconnected: freeproxy.timeoutDisconnected,
                timeoutUnreachable: freeproxy.timeoutUnreachable,
                nextRefreshTs: 0,
            };

            bulk.insert(freeproxyToCreate);
        }

        await bulk.execute();
    }

    async synchronizeFreeproxies(actions: ISynchronizeFreeproxies): Promise<void> {
        this.logger.debug(`synchronizeFreeproxies(): updated.length=${actions.updated.length} / removed.length=${actions.removed.length}`);

        const bulk = this.colFreeproxies.initializeUnorderedBulkOp();
        for (const freeproxy of actions.updated) {
            bulk.find({
                _id: freeproxy.id,
                projectId: freeproxy.projectId,
                connectorId: freeproxy.connectorId,
            })
                .update({
                    $set: {
                        disconnectedTs: freeproxy.disconnectedTs,
                        fingerprint: freeproxy.fingerprint,
                        fingerprintError: freeproxy.fingerprintError,
                    },
                });
        }

        for (const freeproxy of actions.removed) {
            bulk.find({
                _id: freeproxy.id,
                projectId: freeproxy.projectId,
                connectorId: freeproxy.connectorId,
            })
                .deleteOne();
        }

        await bulk.execute();
    }

    async getNextFreeproxiesToRefresh(
        nextRefreshTs: number, count: number
    ): Promise<IFreeproxyToRefresh[]> {
        this.logger.debug(`getNextFreeproxiesToRefresh(): nextRefreshTs=${nextRefreshTs} / count=${count}`);

        const freeproxies = await this.colFreeproxies.find(
            {
                nextRefreshTs: {
                    $lt: nextRefreshTs,
                },
            },
            {
                sort: {
                    nextRefreshTs: 1,
                },
                limit: count,
                projection: FREEPROXY_TO_REFRESH_META_MONGODB,
            }
        )
            .map((p) => fromMongo<IFreeproxyToRefresh>(p))
            .toArray();

        return freeproxies;
    }

    async updateFreeproxiesNextRefreshTs(
        freeproxiesIds: string[], nextRefreshTs: number
    ): Promise<void> {
        this.logger.debug(`updateFreeproxiesNextRefreshTs(): freeproxiesIds.length=${freeproxiesIds.length} / nextRefreshTs=${nextRefreshTs}`);

        const { modifiedCount } = await this.colFreeproxies.updateMany(
            {
                _id: {
                    $in: freeproxiesIds,
                },
            },
            [
                {
                    $set: {
                        nextRefreshTs: {
                            $add: [
                                nextRefreshTs, '$timeoutDisconnected',
                            ],
                        },
                    },
                },
            ]
        );

        if (modifiedCount !== freeproxiesIds.length) {
            const idsFound = await this.colFreeproxies.find(
                {
                    _id: {
                        $in: freeproxiesIds,
                    },
                },
                {
                    projection: {
                        _id: 1,
                    },
                }
            )
                .map((p) => p._id)
                .toArray();
            const idsNotFound = freeproxiesIds.filter((id) => !idsFound.includes(id));

            throw new FreeproxiesNotFoundError(idsNotFound);
        }
    }

    async getAllProjectSourcesById(
        projectId: string, connectorId: string
    ): Promise<ISource[]> {
        this.logger.debug(`getAllProjectSourcesById(): projectId=${projectId} / connectorId=${connectorId}`);

        const sources = await this.colSources.find(
            {
                projectId,
                connectorId,
            },
            {
                projection: SOURCE_META_MONGODB,
            }
        )
            .map((p) => fromMongo<ISource>(p))
            .toArray();

        return sources;
    }

    async getSourceById(
        projectId: string, connectorId: string, sourceId: string
    ): Promise<ISource> {
        this.logger.debug(`getSourceById(): projectId=${projectId} / connectorId=${connectorId} / sourceId=${sourceId}`);

        const sourceModel = await this.colSources.findOne(
            {
                _id: sourceId,
                projectId,
                connectorId,
            },
            {
                projection: SOURCE_META_MONGODB,
            }
        )
            .then((p) => safeFromMongo<ISource>(p));

        if (!sourceModel) {
            throw new SourceNotFoundError(
                projectId,
                connectorId,
                sourceId
            );
        }

        return sourceModel;
    }

    async createSources(sources: ISource[]): Promise<void> {
        this.logger.debug(`createSources(): sources.length=${sources.length}`);

        const bulk = this.colSources.initializeUnorderedBulkOp();
        for (const source of sources) {
            const sourceToCreate: ISourceModel = {
                _id: source.id,
                projectId: source.projectId,
                connectorId: source.connectorId,
                url: source.url,
                delay: source.delay,
                lastRefreshTs: source.lastRefreshTs,
                lastRefreshError: source.lastRefreshError,
                nextRefreshTs: 0,
            };

            bulk.insert(sourceToCreate);
        }

        await bulk.execute();
    }

    async updateSources(sources: ISource[]): Promise<void> {
        this.logger.debug(`updateSources(): sources.length=${sources.length}`);

        const bulk = this.colSources.initializeUnorderedBulkOp();

        for (const source of sources) {
            bulk.find({
                _id: source.id,
                projectId: source.projectId,
                connectorId: source.connectorId,
            })
                .update({
                    $set: {
                        url: source.url,
                        delay: source.delay,
                        lastRefreshTs: source.lastRefreshTs,
                        lastRefreshError: source.lastRefreshError,
                    },
                });
        }

        await bulk.execute();
    }

    async removeSources(sources: ISource[]): Promise<void> {
        this.logger.debug(`removeSources(): sources.length=${sources.length}`);

        const bulk = this.colSources.initializeUnorderedBulkOp();
        for (const source of sources) {
            bulk.find({
                _id: source.id,
                projectId: source.projectId,
                connectorId: source.connectorId,
            })
                .deleteOne();
        }

        await bulk.execute();
    }

    async getNextSourceToRefresh(nextRefreshTs: number): Promise<ISource> {
        this.logger.debug(`getNextSourceToRefresh(): nextRetryTs=${nextRefreshTs}`);

        const sourceModel = await this.colSources.findOne(
            {
                nextRefreshTs: {
                    $lt: nextRefreshTs,
                },
            },
            {
                sort: {
                    nextRefreshTs: 1,
                },
                limit: 1,
                projection: SOURCE_META_MONGODB,
            }
        )
            .then((p) => safeFromMongo<ISource>(p));

        if (!sourceModel) {
            throw new NoSourceToRefreshError();
        }

        return sourceModel;
    }

    async updateSourceNextRefreshTs(
        projectId: string,
        connectorId: string,
        sourceId: string,
        nextRefreshTs: number
    ): Promise<void> {
        this.logger.debug(`updateSourceNextRefreshTs(): projectId=${projectId} / connectorId=${connectorId} / sourceId=${sourceId} / nextRefreshTs=${nextRefreshTs}`);

        const { modifiedCount } = await this.colSources.updateOne(
            {
                _id: sourceId,
                connectorId,
                projectId,
            },
            [
                {
                    $set: {
                        nextRefreshTs,
                    },
                },
            ]
        );

        if (!modifiedCount) {
            throw new SourceNotFoundError(
                projectId,
                connectorId,
                sourceId
            );
        }
    }

    //////////// TASKS ////////////
    async getAllProjectTasksById(projectId: string): Promise<ITaskView[]> {
        this.logger.debug(`getAllProjectTasksById(): projectId=${projectId}`);

        const tasksModel = await this.colTasks.find(
            {
                projectId,
            },
            {
                projection: TASK_VIEW_META_MONGODB,
            }
        )
            .map((t) => fromMongo<ITaskView>(t))
            .toArray();

        return tasksModel;
    }

    async getTaskById(
        projectId: string, taskId: string
    ): Promise<ITaskData> {
        this.logger.debug(`getTaskById(): projectId=${projectId} / taskId=${taskId}`);

        const taskModel = await this.colTasks.findOne(
            {
                _id: taskId,
                projectId,
            },
            {
                projection: TASK_DATA_META_MONGODB,
            }
        )
            .then((c) => safeFromMongo<ITaskData>(c));

        if (!taskModel) {
            throw new TaskNotFoundError(
                projectId,
                taskId
            );
        }

        return taskModel;
    }

    async createTask(task: ITaskData): Promise<void> {
        this.logger.debug(`createTask(): task.id=${task.id}`);

        const taskModel: ITaskModel = {
            _id: task.id,
            projectId: task.projectId,
            connectorId: task.connectorId,
            type: task.type,
            running: task.running,
            cancelled: task.cancelled,
            stepCurrent: task.stepCurrent,
            stepMax: task.stepMax,
            message: task.message,
            startAtTs: task.startAtTs,
            endAtTs: task.endAtTs,
            nextRetryTs: task.nextRetryTs,
            jwt: task.jwt,
            data: task.data,
            locked: false,
        };

        await this.colTasks.insertOne(taskModel);
    }

    async updateTask(task: ITaskData): Promise<void> {
        this.logger.debug(`updateTask(): task.id=${task.id}`);

        const { matchedCount } = await this.colTasks.updateOne(
            {
                _id: task.id,
                projectId: task.projectId,
                connectorId: task.connectorId,
            },
            {
                $set: {
                    running: task.running,
                    cancelled: task.cancelled,
                    stepCurrent: task.stepCurrent,
                    message: task.message,
                    endAtTs: task.endAtTs,
                    nextRetryTs: task.nextRetryTs,
                    data: task.data,
                    locked: false,
                },
            }
        );

        if (!matchedCount) {
            throw new TaskNotFoundError(
                task.projectId,
                task.id
            );
        }
    }

    async lockTask(
        projectId: string, taskId: string
    ): Promise<void> {
        this.logger.debug(`lockTask(): projectId=${projectId} / taskId=${taskId}`);

        await this.colTasks.updateOne(
            {
                _id: taskId,
                projectId,
            },
            {
                $set: {
                    locked: true,
                },
            }
        );
    }

    async removeTask(task: ITaskData): Promise<void> {
        this.logger.debug(`removeTask(): task.id=${task.id}`);

        const { deletedCount } = await this.colTasks.deleteOne({
            _id: task.id,
            projectId: task.projectId,
            connectorId: task.connectorId,
        });

        if (!deletedCount) {
            throw new TaskNotFoundError(
                task.projectId,
                task.id
            );
        }
    }

    async getProjectRunningTaskCount(
        projectId: string, connectorId: string
    ): Promise<number> {
        this.logger.debug(`getProjectRunningTaskCount(): projectId=${projectId} / connectorId=${connectorId}`);

        const count = await this.colTasks.countDocuments({
            projectId,
            connectorId,
            running: true,
        });

        return count;
    }

    async getNextTaskToRefresh(nextRetryTs: number): Promise<ITaskData> {
        this.logger.debug(`getNextTaskToRefresh(): nextRetryTs=${nextRetryTs}`);

        const taskModel = await this.colTasks.findOne(
            {
                running: true,
                nextRetryTs: {
                    $lt: nextRetryTs,
                },
                locked: false,
            },
            {
                sort: {
                    nextRetryTs: 1,
                },
                limit: 1,
                projection: TASK_DATA_META_MONGODB,
            }
        )
            .then((c) => safeFromMongo<ITaskData>(c));

        if (!taskModel) {
            throw new NoTaskToRefreshError();
        }

        return taskModel;
    }

    //////////// PARAMS ////////////
    async getParam(key: string): Promise<string> {
        this.logger.debug(`getParam(): key=${key}`);

        const paramModel = await this.colParams.findOne(
            {
                _id: key,
            },
            {
                projection: {
                    value: 1,
                },
            }
        );

        if (!paramModel) {
            throw new ParamNotFoundError(key);
        }

        return paramModel.value;
    }

    //////////// CERTIFICATES ////////////
    async getCertificateForHostname(hostname: string): Promise<ICertificate> {
        this.logger.debug(`getCertificateForHostname(): hostname=${hostname}`);

        const certificateModel = await this.colCertificates.findOne(
            {
                _id: hostname,
            },
            {
                projection: {
                    _id: 0,
                    cert: 1,
                    key: 1,
                },
            }
        );

        if (!certificateModel) {
            throw new CertificateNotFoundError(hostname);
        }

        return certificateModel;
    }

    async createCertificateForHostname(
        hostname: string, certificate: ICertificate
    ): Promise<void> {
        this.logger.debug(`createCertificateForHostname(): hostname=${hostname}}`);

        const certificateModel: ICertificateModel = {
            _id: hostname,
            ...certificate,
        };

        await this.colCertificates.insertOne(certificateModel);
    }
}
