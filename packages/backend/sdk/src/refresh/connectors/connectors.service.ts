import {
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common';
import { REFRESH_CONNECTORS_MODULE_CONFIG } from './connectors.constants';
import { CommanderRefreshClientService } from '../../commander-client';
import { ConnectorprovidersService } from '../../connectors';
import { NoConnectorToRefreshError } from '../../errors';
import { TransportprovidersService } from '../../transports';
import { ARefresh } from '../refresh.abstract';
import type { IRefreshConnectorsModuleConfig } from './connectors.module';
import type { IConnectorToRefresh } from '@scrapoxy/common';


@Injectable()
export class RefreshConnectorsService extends ARefresh<IConnectorToRefresh> {
    protected readonly logger = new Logger(RefreshConnectorsService.name);

    constructor(
    @Inject(REFRESH_CONNECTORS_MODULE_CONFIG)
        config: IRefreshConnectorsModuleConfig,
        private readonly commander: CommanderRefreshClientService,
        private readonly connectorproviders: ConnectorprovidersService,
        private readonly transportproviders: TransportprovidersService
    ) {
        super(config);
    }

    async next(): Promise<IConnectorToRefresh | undefined> {
        try {
            const connector = await this.commander.getNextConnectorToRefresh();

            return connector;
        } catch (err: any) {
            if (err instanceof NoConnectorToRefreshError) {
                return;
            }

            throw err;
        }
    }

    async task(connector: IConnectorToRefresh): Promise<void> {
        this.logger.debug(`update instances of connector ${connector.id}`);

        try {
            const factory = this.connectorproviders.getFactory(connector.type);
            const service = await factory.buildConnectorService(
                connector,
                this.commander
            );
            const proxies = await service.getProxies(connector.proxiesKeys);
            const transport = this.transportproviders.getTransportByType(factory.config.transportType);
            for (const proxy of proxies) {
                transport.completeProxyConfig(
                    proxy,
                    connector
                );
            }

            const orders = await this.commander.refreshConnectorProxies(
                connector.projectId,
                connector.id,
                proxies
            );
            const promiseToCreate = orders.proxiesToCreateCount > 0 ?
                service.createProxies(
                    orders.proxiesToCreateCount,
                    connector.proxiesMax,
                    connector.proxiesKeys
                ) : Promise.resolve([]);
            const promiseToStart = orders.keysToStart.length > 0 ?
                service.startProxies(
                    orders.keysToStart,
                    connector.proxiesMax
                ) : Promise.resolve();
            const promiseToRemove = orders.keysToRemove.length > 0 ?
                service.removeProxies(
                    orders.keysToRemove,
                    connector.proxiesMax
                ) : Promise.resolve([]);
            const [
                proxiesCreated, , proxiesRemoved,
            ] = await Promise.all([
                promiseToCreate, promiseToStart, promiseToRemove,
            ]);

            if (
                proxiesCreated.length > 0 ||
                proxiesRemoved.length > 0
            ) {
                for (const proxy of proxiesCreated) {
                    transport.completeProxyConfig(
                        proxy,
                        connector
                    );
                }

                await this.commander.createAndRemoveConnectorProxies(
                    connector.projectId,
                    connector.id,
                    {
                        created: proxiesCreated,
                        keysRemoved: proxiesRemoved,
                    }
                );
            }

            if (connector.error) {
                await this.commander.setConnectorError(
                    connector.projectId,
                    connector.id,
                    null
                );
            }
        } catch (err: any) {
            if (connector.error !== err.message) {
                await this.commander.setConnectorError(
                    connector.projectId,
                    connector.id,
                    err.message
                );
            }

            throw err;
        }
    }
}
