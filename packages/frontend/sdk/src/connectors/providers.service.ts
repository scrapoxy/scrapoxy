import { Injectable } from '@angular/core';
import type { IConnectorFactory } from './providers.interface';


@Injectable()
export class ConnectorprovidersService {
    private static readonly factoriesMap = new Map<string, IConnectorFactory>();

    register(factory: IConnectorFactory) {
        if (!factory.type || factory.type.length <= 0) {
            throw new Error('Connector factory type should be empty');
        }

        if (ConnectorprovidersService.factoriesMap.has(factory.type)) {
            throw new Error(`Connector factory type ${factory.type} is already registered`);
        }

        console.log(`[ConnectorprovidersService] register factory.type=${factory.type}`);

        ConnectorprovidersService.factoriesMap.set(
            factory.type,
            factory
        );
    }

    get factories(): IConnectorFactory[] {
        return Array.from(ConnectorprovidersService.factoriesMap.values());
    }

    getFactory(type: string): IConnectorFactory {
        const factory = ConnectorprovidersService.factoriesMap.get(type);

        if (!factory) {
            throw new Error(`Cannot find connector factory (type=${type})`);
        }

        return factory;
    }
}
