import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
    AuthLocalModule,
    CommanderUsersModule,
    LogExceptionFilter,
    ScrapoxyExpressAdapter,
} from '@scrapoxy/backend-sdk';
import { buildStorageModules } from '@scrapoxy/backend-test-sdk';
import axios from 'axios';
import type { INestApplication } from '@nestjs/common';
import type { AddressInfo } from 'net';


describe(
    'Commander - Users',
    () => {
        const logger = new Logger();
        let
            app: INestApplication,
            port: number;

        beforeAll(async() => {
            const storageModules = buildStorageModules();
            const moduleRef = await Test.createTestingModule({
                imports: [
                    ...storageModules.modules,
                    AuthLocalModule.forRoot({
                        username: 'myusername',
                        password: 'mypassword',
                        test: false,
                    }),
                    CommanderUsersModule.forRoot(),
                ],
            })
                .setLogger(logger)
                .compile();
            app = moduleRef.createNestApplication(new ScrapoxyExpressAdapter());
            app.enableShutdownHooks();
            app.useGlobalFilters(new LogExceptionFilter());
            await app.listen(0);

            const address = app.getHttpServer()
                .address() as AddressInfo;
            port = address.port;
        });

        afterAll(async() => {
            await app.close();
        });

        describe(
            'Auths - Local',
            () => {
                it(
                    'should not connect with empty credential',
                    async() => {
                        await expect(axios.post(
                            `http://localhost:${port}/api/users/auths/local`,
                            {}
                        )).rejects.toThrow('failed with status code 401');
                    }
                );

                it(
                    'should not connect with invalid credential',
                    async() => {
                        await expect(axios.post(
                            `http://localhost:${port}/api/users/auths/local`,
                            {
                                username: 'invalidusername',
                                password: 'invalidpassword',
                            }
                        )).rejects.toThrow('failed with status code 401');
                    }
                );

                it(
                    'should connect with valid credential',
                    async() => {
                        const res = await axios.post(
                            `http://localhost:${port}/api/users/auths/local`,
                            {
                                username: 'myusername',
                                password: 'mypassword',
                            }
                        );

                        expect(res.status)
                            .toBe(200);
                    }
                );
            }
        );
    }
);
