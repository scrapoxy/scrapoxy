import { Logger } from '@nestjs/common';
import {
    DatacenterLocalApp,
    SUBSCRIPTION_LOCAL_DEFAULTS,
    SubscriptionDatacenterLocalAlreadyExistsError,
    SubscriptionDatacenterLocalNotFoundError,
    ValidationError,
} from '@scrapoxy/backend-sdk';
import { v4 as uuid } from 'uuid';
import type {
    ISubscriptionDatacenterLocalToCreate,
    ISubscriptionDatacenterLocalToUpdate,
} from '@scrapoxy/common';


describe(
    'Datacenter Local - Subscriptions',
    () => {
        const
            datacenterLocalApp = new DatacenterLocalApp(new Logger()),
            subscriptionToCreate: ISubscriptionDatacenterLocalToCreate = {
                id: uuid(),
                ...SUBSCRIPTION_LOCAL_DEFAULTS,
            },
            subscriptionToUpdate: ISubscriptionDatacenterLocalToUpdate = {
                instancesLimit: 10,
                installDelay: 11,
                startingDelay: 12,
                stoppingDelay: 13,
                transitionStartingToStarted: false,
                transitionStoppingToStopped: false,
            };

        beforeAll(async() => {
            await datacenterLocalApp.start();
        });

        afterAll(async() => {
            await datacenterLocalApp.close();
        });

        it(
            'should not have any subscription',
            async() => {
                const subscriptions = await datacenterLocalApp.client.getAllSubscriptions();
                expect(subscriptions)
                    .toHaveLength(0);
            }
        );

        it(
            'should not create a subscription with empty payload',
            async() => {
                const payload: any = null;

                await expect(datacenterLocalApp.client.createSubscription(payload))
                    .rejects
                    .toThrowError(ValidationError);
            }
        );

        it(
            'should not create a subscription with missing fields',
            async() => {
                const payload: any = {
                    instancesLimit: 100,
                };

                await expect(datacenterLocalApp.client.createSubscription(payload))
                    .rejects
                    .toThrowError(ValidationError);
            }
        );

        it(
            'should not create a subscription with wrong type fields',
            async() => {
                const payload: any = {
                    ...SUBSCRIPTION_LOCAL_DEFAULTS,
                    transitionStoppingToStopped: 10,
                };

                await expect(datacenterLocalApp.client.createSubscription(payload))
                    .rejects
                    .toThrowError(ValidationError);
            }
        );

        it(
            'should create a subscription',
            async() => {
                const subscription = await datacenterLocalApp.client.createSubscription(subscriptionToCreate);

                expect(subscription.id)
                    .toBe(subscriptionToCreate.id);

                const subscriptionFound = await datacenterLocalApp.client.getSubscription(subscription.id);

                expect(subscriptionFound)
                    .toEqual({
                        ...subscriptionToCreate,
                        removeForcedCount: 0,
                    });
            }
        );

        it(
            'should not create a subscription with the same id',
            async() => {
                await expect(datacenterLocalApp.client.createSubscription(subscriptionToCreate))
                    .rejects
                    .toThrowError(SubscriptionDatacenterLocalAlreadyExistsError);
            }
        );

        it(
            'should not update an unknown subscription',
            async() => {

                await expect(datacenterLocalApp.client.updateSubscription(
                    uuid(),
                    subscriptionToUpdate
                ))
                    .rejects
                    .toThrowError(SubscriptionDatacenterLocalNotFoundError);
            }
        );

        it(
            'should not update a subscription with empty payload',
            async() => {
                const payload: any = null;

                await expect(datacenterLocalApp.client.updateSubscription(
                    subscriptionToCreate.id,
                    payload
                ))
                    .rejects
                    .toThrowError(ValidationError);
            }
        );

        it(
            'should not create a subscription with missing fields',
            async() => {
                const payload: any = {
                    instancesLimit: 100,
                };

                await expect(datacenterLocalApp.client.updateSubscription(
                    subscriptionToCreate.id,
                    payload
                ))
                    .rejects
                    .toThrowError(ValidationError);
            }
        );

        it(
            'should update a subscription',
            async() => {


                await datacenterLocalApp.client.updateSubscription(
                    subscriptionToCreate.id,
                    subscriptionToUpdate
                );

                const subscriptionFound = await datacenterLocalApp.client.getSubscription(subscriptionToCreate.id);

                expect(subscriptionFound)
                    .toEqual({
                        ...subscriptionToCreate,
                        ...subscriptionToUpdate,
                        removeForcedCount: 0,
                    });
            }
        );

        it(
            'should not remove an unknown subscription',
            async() => {

                await expect(datacenterLocalApp.client.removeSubscription(uuid()))
                    .rejects
                    .toThrowError(SubscriptionDatacenterLocalNotFoundError);
            }
        );

        it(
            'should remove a subscription',
            async() => {
                await datacenterLocalApp.client.removeSubscription(subscriptionToCreate.id);

                const subscriptions = await datacenterLocalApp.client.getAllSubscriptions();
                expect(subscriptions)
                    .toHaveLength(0);
            }
        );
    }
);
