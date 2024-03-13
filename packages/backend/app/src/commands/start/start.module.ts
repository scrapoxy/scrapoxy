import { resolve } from 'path';
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import {
    ConnectorAwsModule,
    ConnectorAzureModule,
    ConnectorDatacenterLocalModule,
    ConnectorDigitaloceanModule,
    ConnectorFreeproxiesModule,
    ConnectorGcpModule,
    ConnectorHypeproxyModule,
    ConnectorIproyalResidentialModule,
    ConnectorIproyalServerModule,
    ConnectorNimblewayModule,
    ConnectorNinjasproxyModule,
    ConnectorOvhModule,
    ConnectorProxidizeModule,
    ConnectorProxyCheapResidentialModule,
    ConnectorProxyCheapServerModule,
    ConnectorProxyLocalModule,
    ConnectorProxyrackModule,
    ConnectorProxySellerResidentialModule,
    ConnectorProxySellerServerModule,
    ConnectorRayobyteModule,
    ConnectorXProxyModule,
    ConnectorZyteModule,
} from '@scrapoxy/backend-connectors';
import {
    AuthGithubModule,
    AuthGoogleModule,
    AuthLocalModule,
    CommanderCaCertificateModule,
    CommanderEventsModule,
    CommanderFrontendModule,
    CommanderMasterModule,
    CommanderRefreshModule,
    CommanderScraperModule,
    CommanderUsersModule,
    getEnvAssetsPath,
    getEnvAuthGithubModuleConfig,
    getEnvAuthGoogleModuleConfig,
    getEnvAuthLocalModuleConfig,
    MasterModule,
    ProbeModule,
    RefreshConnectorsModule,
    RefreshFreeproxiesModule,
    RefreshMetricsModule,
    RefreshProxiesModule,
    RefreshSourcesModule,
    RefreshTasksModule,
    StorageDistributedConnModule,
    StorageDistributedMsModule,
    StorageFileModule,
    StorageMemoryModule,
} from '@scrapoxy/backend-sdk';
import { getEnvCommanderPort } from './start.helpers';
import type { DynamicModule } from '@nestjs/common';


export interface IAppStartModuleConfig {
    version: string;
    standalone?: boolean;
    master?: boolean;
    commander?: boolean;
    distributed?: string;
    frontend?: boolean;
    refreshAll?: boolean;
    refreshConnectors?: boolean;
    refreshFreeproxies?: boolean;
    refreshMetrics?: boolean;
    refreshProxies?: boolean;
    refreshTasks?: boolean;
    storage?: string;
    test?: boolean;
    datacenterLocalAppUrl?: string;
    proxyLocalAppUrl?: string;
}


@Module({
    imports: [],
})
export class AppStartModule {
    static forRoot(options: IAppStartModuleConfig): DynamicModule {
        // Connectors
        const imports: any = [
            ConnectorAwsModule,
            ConnectorAzureModule,
            ConnectorDigitaloceanModule,
            ConnectorFreeproxiesModule,
            ConnectorGcpModule,
            ConnectorHypeproxyModule,
            ConnectorIproyalResidentialModule,
            ConnectorIproyalServerModule,
            ConnectorNimblewayModule,
            ConnectorNinjasproxyModule,
            ConnectorOvhModule,
            ConnectorProxyCheapResidentialModule,
            ConnectorProxyCheapServerModule,
            ConnectorProxySellerResidentialModule,
            ConnectorProxySellerServerModule,
            ConnectorProxidizeModule,
            ConnectorProxyrackModule,
            ConnectorRayobyteModule,
            ConnectorXProxyModule,
            ConnectorZyteModule,
            ProbeModule.forRootFromEnv(),
        ];

        if (options.datacenterLocalAppUrl) {
            imports.push(ConnectorDatacenterLocalModule.forRoot({
                url: options.datacenterLocalAppUrl,
            }));
        }

        if (options.proxyLocalAppUrl) {
            imports.push(ConnectorProxyLocalModule.forRoot({
                url: options.proxyLocalAppUrl,
            }));
        }

        // Frontend
        if (options.frontend) {
            imports.push(ServeStaticModule.forRoot({
                rootPath: resolve(
                    getEnvAssetsPath(),
                    'frontend'
                ),
            }));
        }

        // Storage
        if (options.storage) {
            switch (options.storage) {
                case 'memory': {
                    imports.push(StorageMemoryModule.forRoot());
                    break;
                }

                case 'distributed': {
                    switch (options.distributed) {
                        case 'read': {
                            imports.push(StorageDistributedConnModule.forRoot());
                            break;
                        }

                        case 'write': {
                            imports.push(StorageDistributedMsModule.forRoot());
                            break;
                        }

                        // File is the default
                        default: {
                            imports.push(
                                StorageDistributedConnModule.forRoot(),
                                StorageDistributedMsModule.forRoot()
                            );
                            break;
                        }
                    }

                    break;
                }

                case 'file': {
                    imports.push(StorageFileModule.forRoot());

                    break;
                }

                default: {
                    // Don't add any storage
                    break;
                }
            }
        }

        // Frontend
        const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:8890';
        // Commander
        const commanderUrl = process.env.COMMANDER_URL ?? `http://localhost:${getEnvCommanderPort()}/api`;

        if (options.commander) {
            imports.push(
                CommanderCaCertificateModule,
                CommanderEventsModule.forRoot(),
                CommanderFrontendModule.forRoot(options.version),
                CommanderMasterModule.forRoot(),
                CommanderRefreshModule.forRootFromEnv(),
                CommanderScraperModule,
                CommanderUsersModule.forRoot()
            );

            // Auth
            let hasAuth = false;
            const configAuthLocal = getEnvAuthLocalModuleConfig();

            if (configAuthLocal) {
                hasAuth = true;
                imports.push(AuthLocalModule.forRoot(configAuthLocal));
            }

            const configAuthGithub = getEnvAuthGithubModuleConfig(frontendUrl);

            if (configAuthGithub) {
                hasAuth = true;
                imports.push(AuthGithubModule.forRoot(configAuthGithub));
            }

            const configAuthGoogle = getEnvAuthGoogleModuleConfig(frontendUrl);

            if (configAuthGoogle) {
                hasAuth = true;
                imports.push(AuthGoogleModule.forRoot(configAuthGoogle));
            }

            if (!hasAuth) {
                throw new Error('No auth module has been enabled');
            }
        }

        // Master
        const trackSockets = process.env.NODE_ENV !== 'production';

        if (options.master) {
            imports.push(MasterModule.forRootFromEnv(
                commanderUrl,
                options.version,
                trackSockets
            ));
        }

        // Refresh
        if (options.refreshConnectors) {
            imports.push(RefreshConnectorsModule.forRoot(
                commanderUrl,
                options.version
            ));
        }

        if (options.refreshFreeproxies) {
            imports.push(
                RefreshFreeproxiesModule.forRoot(
                    commanderUrl,
                    options.version
                ),
                RefreshSourcesModule.forRoot(
                    commanderUrl,
                    options.version
                )
            );
        }

        if (options.refreshMetrics) {
            imports.push(RefreshMetricsModule.forRoot(
                commanderUrl,
                options.version
            ));
        }

        if (options.refreshProxies) {
            imports.push(RefreshProxiesModule.forRoot(
                commanderUrl,
                options.version,
                trackSockets
            ));
        }

        if (options.refreshTasks) {
            imports.push(RefreshTasksModule.forRoot(
                commanderUrl,
                options.version
            ));
        }

        return {
            module: AppStartModule,
            imports,
        };
    }
}
