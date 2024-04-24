import {
    Injectable,
    Logger,
} from '@nestjs/common';
import { TransportNotFoundError } from '../errors';
import type { ATransportService } from './transport.abstract';


@Injectable()
export class TransportprovidersService {
    private readonly logger = new Logger(TransportprovidersService.name);

    private readonly transports = new Map<string, ATransportService>();

    register(transport: ATransportService) {
        if (!transport.type || transport.type.length <= 0) {
            throw new Error('Transport type should not be empty');
        }

        if (this.transports.has(transport.type)) {
            throw new Error(`Transport type ${transport.type} is already registered`);
        }

        this.logger.debug(`register(): transport.type=${transport.type}`);

        this.transports.set(
            transport.type,
            transport
        );
    }

    getTransportByType(type: string): ATransportService {
        const transport = this.transports.get(type);

        if (!transport) {
            throw new TransportNotFoundError(type);
        }

        return transport;
    }
}
