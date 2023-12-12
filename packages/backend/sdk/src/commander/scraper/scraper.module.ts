import { Module } from '@nestjs/common';
import { CommanderScraperController } from './scraper.controller';
import { CommanderScraperService } from './scraper.service';
import { CommanderScraperTokenGuard } from './token.guard';
import { StorageprovidersModule } from '../../storages';


@Module({
    imports: [
        StorageprovidersModule,
    ],
    providers: [
        CommanderScraperService, CommanderScraperTokenGuard,
    ],
    controllers: [
        CommanderScraperController,
    ],
})
export class CommanderScraperModule {}
