import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { EventsService } from '../../../events';
import { MESSAGE_EVENTS } from '../distributed.constants';
import type { IEvent } from '@scrapoxy/common';


@Controller()
export class StorageDistributedConnController {
    constructor(private readonly events: EventsService) {}

    @EventPattern(MESSAGE_EVENTS)
    async proxyEvent(events: IEvent[]): Promise<void> {
        for (const event of events) {
            await this.events.emit(event);
        }
    }
}
