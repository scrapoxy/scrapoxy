import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';


@Module({
    providers: [
        TasksService,
    ],
    exports: [
        TasksService,
    ],
})
export class TasksModule {}
