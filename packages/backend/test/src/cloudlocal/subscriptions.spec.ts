import { Logger } from '@nestjs/common';
import { ValidationError } from '@scrapoxy/backend-sdk';
import {
    CloudlocalApp,
    SUBSCRIPTION_LOCAL_DEFAULTS,
    SubscriptionCloudlocalAlreadyExistsError,
    SubscriptionCloudlocalNotFoundError,
} from '@scrapoxy/cloudlocal';
import { v4 as uuid } from 'uuid';
import type {
    ISubscriptionCloudlocalToCreate,
    ISubscriptionCloudlocalToUpdate,
} from '@scrapoxy/connector-cloudlocal-sdk';


describe(
    'Cloud Local - Subscriptions',
    () => {
        const
            cloudlocalApp = new CloudlocalApp(new Logger()),
            subscriptionToCreate: ISubscriptionCloudlocalToCreate = {
                id: uuid(),
                ...SUBSCRIPTION_LOCAL_DEFAULTS,
            },
            subscriptionToUpdate: ISubscriptionCloudlocalToUpdate = {
                instancesLimit: 10,
                installDelay: 11,
                startingDelay: 12,
                stoppingDelay: 13,
                transitionStartingToStarted: false,
                transitionStoppingToStopped: false,
            };

        beforeAll(async() => {
            await cloudlocalApp.start();
        });

        afterAll(async() => {
            await cloudlocalApp.close();
        });

        it(
            'should not have any subscription',
            async() => {
                const subscriptions = await cloudlocalApp.client.getAllSubscriptions();
                expect(subscriptions)
                    .toHaveLength(0);
            }
        );

        it(
            'should not create a subscription with empty payload',
            async() => {
                const payload: any = null;

                await expect(cloudlocalApp.client.createSubscription(payload))
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

                await expect(cloudlocalApp.client.createSubscription(payload))
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

                await expect(cloudlocalApp.client.createSubscription(payload))
                    .rejects
                    .toThrowError(ValidationError);
            }
        );

        it(
            'should create a subscription',
            async() => {
                const subscription = await cloudlocalApp.client.createSubscription(subscriptionToCreate);

                expect(subscription.id)
                    .toBe(subscriptionToCreate.id);

                const subscriptionFound = await cloudlocalApp.client.getSubscription(subscription.id);

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
                await expect(cloudlocalApp.client.createSubscription(subscriptionToCreate))
                    .rejects
                    .toThrowError(SubscriptionCloudlocalAlreadyExistsError);
            }
        );

        it(
            'should not update an unknown subscription',
            async() => {

                await expect(cloudlocalApp.client.updateSubscription(
                    uuid(),
                    subscriptionToUpdate
                ))
                    .rejects
                    .toThrowError(SubscriptionCloudlocalNotFoundError);
            }
        );

        it(
            'should not update a subscription with empty payload',
            async() => {
                const payload: any = null;

                await expect(cloudlocalApp.client.updateSubscription(
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

                await expect(cloudlocalApp.client.updateSubscription(
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


                await cloudlocalApp.client.updateSubscription(
                    subscriptionToCreate.id,
                    subscriptionToUpdate
                );

                const subscriptionFound = await cloudlocalApp.client.getSubscription(subscriptionToCreate.id);

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

                await expect(cloudlocalApp.client.removeSubscription(uuid()))
                    .rejects
                    .toThrowError(SubscriptionCloudlocalNotFoundError);
            }
        );

        it(
            'should remove a subscription',
            async() => {
                await cloudlocalApp.client.removeSubscription(subscriptionToCreate.id);

                const subscriptions = await cloudlocalApp.client.getAllSubscriptions();
                expect(subscriptions)
                    .toHaveLength(0);
            }
        );
    }
);
