import {
    Injectable,
    Logger,
} from '@nestjs/common';
import { ConnectorFactoryNotFoundError } from '../commander-client';
import type { IConnectorFactory } from './providers.interface';


@Injectable()
export class ConnectorprovidersService {
    private readonly logger = new Logger(ConnectorprovidersService.name);

    private readonly factories = new Map<string, IConnectorFactory>();

    register(factory: IConnectorFactory) {
        if (!factory.type || factory.type.length <= 0) {
            throw new Error('Connector factory type should not be empty');
        }

        if (this.factories.has(factory.type)) {
            throw new Error(`Connector factory type ${factory.type} is already registered`);
        }

        this.logger.debug(`register(): factory.type=${factory.type}`);

        this.factories.set(
            factory.type,
            factory
        );
    }

    getFactory(type: string): IConnectorFactory {
        const factory = this.factories.get(type);

        if (!factory) {
            throw new ConnectorFactoryNotFoundError(type);
        }

        return factory;
    }

    getAllTypes(): string[] {
        return Array.from(this.factories.keys());
    }
}
