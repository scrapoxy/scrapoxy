import { resolve } from 'path';
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import {
    ConnectorAwsModule,
    ConnectorAzureModule,
    ConnectorBrightdataModule,
    ConnectorDatacenterLocalModule,
    ConnectorDecodoModule,
    ConnectorDigitaloceanModule,
    ConnectorEvomiModule,
    ConnectorFreeproxiesModule,
    ConnectorGcpModule,
    ConnectorGeonodeModule,
    ConnectorHypeproxyModule,
    ConnectorIproyalResidentialModule,
    ConnectorIproyalServerModule,
    ConnectorLiveproxiesModule,
    ConnectorMassiveModule,
    ConnectorNetnutModule,
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
    ConnectorScalewayModule,
    ConnectorTencentModule,
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
import type { IAppStartModuleConfig } from './start.interface';
import type { DynamicModule } from '@nestjs/common';


@Module({
    imports: [],
})
export class AppStartModule {
    static forRoot(options: IAppStartModuleConfig): DynamicModule {
        // Connectors
        const imports: any = [
            ConnectorAwsModule,
            ConnectorAzureModule,
            ConnectorBrightdataModule,
            ConnectorDecodoModule,
            ConnectorDigitaloceanModule,
            ConnectorEvomiModule,
            ConnectorFreeproxiesModule,
            ConnectorGcpModule,
            ConnectorGeonodeModule,
            ConnectorHypeproxyModule,
            ConnectorIproyalResidentialModule,
            ConnectorIproyalServerModule,
            ConnectorLiveproxiesModule,
            ConnectorMassiveModule,
            ConnectorNetnutModule,
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
            ConnectorScalewayModule,
            ConnectorTencentModule,
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
                CommanderFrontendModule.forRoot(options.package.version),
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
                options.package.version,
                trackSockets
            ));
        }

        // Refresh
        if (options.refreshConnectors) {
            imports.push(RefreshConnectorsModule.forRoot(
                commanderUrl,
                options.package.version
            ));
        }

        if (options.refreshFreeproxies) {
            imports.push(
                RefreshFreeproxiesModule.forRoot(
                    commanderUrl,
                    options.package.version
                ),
                RefreshSourcesModule.forRoot(
                    commanderUrl,
                    options.package.version
                )
            );
        }

        if (options.refreshMetrics) {
            imports.push(RefreshMetricsModule.forRoot(
                commanderUrl,
                options.package.version
            ));
        }

        if (options.refreshProxies) {
            imports.push(RefreshProxiesModule.forRoot(
                commanderUrl,
                options.package.version,
                trackSockets
            ));
        }

        if (options.refreshTasks) {
            imports.push(RefreshTasksModule.forRoot(
                commanderUrl,
                options.package.version
            ));
        }

        return {
            module: AppStartModule,
            imports,
        };
    }
}
