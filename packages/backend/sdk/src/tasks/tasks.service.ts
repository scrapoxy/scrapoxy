import {
    Injectable,
    Logger,
} from '@nestjs/common';
import { TaskFactoryNotFoundError } from '../errors';
import type { ITaskFactory } from '@scrapoxy/common';


@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    private readonly factories = new Map<string, ITaskFactory>();

    register(
        type: string, factory: ITaskFactory
    ) {
        if (!type || type.length <= 0) {
            throw new Error('Task factory type should not be empty');
        }

        if (this.factories.has(type)) {
            throw new Error(`Task factory ${type} is already registered`);
        }

        this.logger.debug(`register(): factory.type=${type}`);

        this.factories.set(
            type,
            factory
        );
    }

    getFactory(type: string): ITaskFactory {
        const factory = this.factories.get(type);

        if (!factory) {
            throw new TaskFactoryNotFoundError(type);
        }

        return factory;
    }
}
