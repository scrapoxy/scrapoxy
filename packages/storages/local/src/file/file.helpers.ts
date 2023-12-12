import type { UmzugStorage } from 'umzug';


export class DirectStorage implements UmzugStorage {
    constructor(private readonly migrations: string[]) {}

    async logMigration({ name: migrationName }: { name: string }): Promise<void> {
        this.migrations.push(migrationName);
    }

    async unlogMigration({ name: migrationName }: { name: string }): Promise<void> {
        let ind = this.migrations.indexOf(migrationName);
        while (ind >= 0) {
            this.migrations.splice(
                ind,
                1
            );
            ind = this.migrations.indexOf(migrationName);
        }
    }

    async executed(): Promise<string[]> {
        return this.migrations;
    }
}
