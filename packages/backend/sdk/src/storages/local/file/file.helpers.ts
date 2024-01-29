import type { UmzugStorage } from 'umzug';


interface IMigration {
    name: string;
}


export class DirectStorage implements UmzugStorage<IMigration> {
    constructor(private readonly migrations: string[]) {}

    async logMigration(migration: IMigration): Promise<void> {
        this.migrations.push(migration.name);
    }

    async unlogMigration(migration: IMigration): Promise<void> {
        let ind = this.migrations.indexOf(migration.name);
        while (ind >= 0) {
            this.migrations.splice(
                ind,
                1
            );
            ind = this.migrations.indexOf(migration.name);
        }
    }

    async executed(): Promise<string[]> {
        return this.migrations;
    }
}
