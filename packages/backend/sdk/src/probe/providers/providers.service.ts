import {
    Injectable,
    Logger,
} from '@nestjs/common';
import type {
    IProbeService,
    IProbeStatus,
} from './providers.interface';


@Injectable()
export class ProbeprovidersService {
    private readonly logger = new Logger(ProbeprovidersService.name);

    private readonly probes = new Map<string, IProbeService>();

    register(probe: IProbeService) {
        if (!probe.type || probe.type.length <= 0) {
            throw new Error('Probe type should not be empty');
        }

        if (this.probes.has(probe.type)) {
            throw new Error(`Probe type ${probe.type} is already registered`);
        }

        this.logger.debug(`register(): probe.type=${probe.type}`);

        this.probes.set(
            probe.type,
            probe
        );
    }

    getProbeStatus(): IProbeStatus {
        const status: IProbeStatus = {};

        for (const [
            key, probe,
        ] of this.probes.entries()) {
            status[ key ] = probe.alive;
        }

        return status;
    }
}
