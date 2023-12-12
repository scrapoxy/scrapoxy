import { Pipe } from '@angular/core';
import { ConnectorprovidersService } from './providers.service';
import type { PipeTransform } from '@angular/core';


@Pipe({
    name: 'connectorName',
})
export class ConnectorNamePipe implements PipeTransform {
    constructor(private readonly connectorproviders: ConnectorprovidersService) {
    }

    transform(type: string): string {
        const factory = this.connectorproviders.getFactory(type);

        return factory.config.name;
    }
}
