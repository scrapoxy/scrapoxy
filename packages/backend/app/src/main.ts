import * as fs from 'fs';
import { resolve } from 'path';
import { ConsoleLogger } from '@nestjs/common';
import { Command } from 'commander';
import { addCommandCheckConnectors } from './commands/check-connectors';
import { addCommandStart } from './commands/start';


function getPackageVersion(): string {
    try {
        const filename = resolve(
            __dirname,
            'package.json'
        );
        const packageJson = JSON.parse(fs.readFileSync(
            filename,
            'utf8'
        ));

        return packageJson.version;
    } catch (err) {
        return 'unknown';
    }
}


// Set logging level
const logger = new ConsoleLogger();

if (process.env.NODE_ENV === 'production') {
    logger.setLogLevels([
        'error', 'warn', 'log',
    ]);
}

// Prepare command line
const version = getPackageVersion();
const program = new Command();
program
    .name('scrapoxy')
    .version(version)
    .description('Scrapoxy');


addCommandStart(
    program,
    version,
    logger
);
addCommandCheckConnectors(
    program,
    logger
);

// Parse & run command line
program.parseAsync(process.argv)
    .catch((err: any) => {
        logger.error(
            err,
            err.stack
        );
    });
