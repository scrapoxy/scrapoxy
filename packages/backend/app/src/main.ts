import * as fs from 'fs';
import { resolve } from 'path';
import { ConsoleLogger } from '@nestjs/common';
import { Command } from 'commander';
import { addCommandCheckConnectors } from './commands/check-connectors';
import { addCommandStart } from './commands/start';
import type { IPackageInfo } from './commands/start/start.interface';


function getPackageInfo(): IPackageInfo {
    let info: IPackageInfo;
    try {
        const filename = resolve(
            __dirname,
            'package.json'
        );
        const packageJson = JSON.parse(fs.readFileSync(
            filename,
            'utf8'
        ));

        info = {
            name: packageJson.name,
            version: packageJson.version,
            description: packageJson.description,
        };
    } catch (err) {
        info = {
            name: 'unknown',
            version: 'unknown',
            description: 'unknown',
        };
    }

    return info;
}


// Set logging level
const logger = new ConsoleLogger();

if (process.env.NODE_ENV === 'production') {
    logger.setLogLevels([
        'error', 'warn', 'log',
    ]);
}

// Prepare command line
const pkg = getPackageInfo();
const program = new Command();
program
    .name(pkg.name)
    .version(pkg.version)
    .description(pkg.description);


addCommandStart(
    program,
    pkg,
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
