import { NestFactory } from '@nestjs/core';
import { Command } from 'commander';
import { CheckConnectorsModule } from './check.module';
import { CheckConnectorsService } from './check.service';
import type { LoggerService } from '@nestjs/common';


async function command(logger: LoggerService) {
    const app = await NestFactory.createApplicationContext(
        CheckConnectorsModule.forRoot(),
        {
            logger,
        }
    );
    const service = app.get(CheckConnectorsService);

    await service.run();

    await app.close();
}


export function addCommand(
    program: Command,
    logger: LoggerService
) {
    program
        .command('checkconnectors')
        .description('Check if connectors have running proxies')
        .action(() => command(logger));
}
