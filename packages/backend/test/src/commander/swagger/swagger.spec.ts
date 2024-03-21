import { promises as fs } from 'fs';
import { Logger } from '@nestjs/common';
import {
    AuthLocalModule,
    CommanderEventsModule,
    CommanderScraperModule,
    CommanderUsersModule,
} from '@scrapoxy/backend-sdk';
import { CommanderApp } from '@scrapoxy/backend-test-sdk';
import axios from 'axios';


describe(
    'Commander - Swagger',
    () => {
        const logger = new Logger();
        let commanderApp: CommanderApp;

        beforeAll(async() => {
            // Start app
            commanderApp = new CommanderApp({
                imports: [
                    AuthLocalModule.forRoot({
                        test: true,
                    }),
                    CommanderEventsModule.forRoot(),
                    CommanderScraperModule,
                    CommanderUsersModule.forRoot(),
                ],
                logger,
            });
            await commanderApp.start();
        });

        afterAll(async() => {
            await commanderApp.stop();
        });

        describe(
            'Swagger',
            () => {
                it(
                    'should have the same swagger JSON files',
                    async() => {
                        const targetRaw = await fs.readFile(
                            'packages/backend/test/src/assets/swagger.json',
                            'utf8'
                        );
                        const target = JSON.parse(targetRaw);
                        const res = await axios.get(`${commanderApp.url}-json`);

                        expect(res.data)
                            .toMatchObject(target);
                    }
                );
            }
        );
    }
);
