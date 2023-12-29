import { Logger } from '@nestjs/common';
import {
    generateCertificateSelfSignedForTest,
    ValidationError,
} from '@scrapoxy/backend-sdk';
import { waitFor } from '@scrapoxy/backend-test-sdk';
import {
    CloudlocalApp,
    ImageCloudlocalNotFoundError,
    InstanceCloudlocalAlreadyExistsError,
    InstanceCloudlocalCreateError,
    RegionCloudlocalNotFoundError,
    RegionSizeCloudlocalNotFoundError,
    SUBSCRIPTION_LOCAL_DEFAULTS,
    SubscriptionCloudlocalNotFoundError,
} from '@scrapoxy/cloudlocal';
import { randomName } from '@scrapoxy/common';
import {
    EImageCloudlocalStatus,
    EInstanceCloudlocalStatus,
} from '@scrapoxy/connector-cloudlocal-sdk';
import { v4 as uuid } from 'uuid';
import type {
    IImageCloudlocalView,
    IInstancesCloudlocalToCreate,
    ISubscriptionCloudlocalView,
} from '@scrapoxy/connector-cloudlocal-sdk';


describe(
    'Cloud Local - Instances',
    () => {
        const cloudlocalApp = new CloudlocalApp(new Logger());
        let
            image: IImageCloudlocalView,
            instancesToCreate: IInstancesCloudlocalToCreate,
            subscription: ISubscriptionCloudlocalView;

        beforeAll(async() => {
            // Start local cloud
            await cloudlocalApp.start();

            // Create subscription
            subscription = await cloudlocalApp.client.createSubscription({
                ...SUBSCRIPTION_LOCAL_DEFAULTS,
                transitionStartingToStarted: false,
                transitionStoppingToStopped: false,
                id: uuid(),
            });

            // Create image
            image = await cloudlocalApp.client.createImage(
                subscription.id,
                'europe',
                {
                    id: randomName(),
                    certificate: generateCertificateSelfSignedForTest(),
                }
            );

            await waitFor(async() => {
                const imageFound = await cloudlocalApp.client.getImage(
                    subscription.id,
                    'europe',
                    image.id
                );

                expect(imageFound.status)
                    .toBe(EImageCloudlocalStatus.READY);
            });

            instancesToCreate = {
                ids: [
                    randomName(), randomName(),
                ],
                size: 'small',
                imageId: image.id,
            };
        });

        afterAll(async() => {
            await cloudlocalApp.close();
        });

        it(
            'should not have any instance',
            async() => {
                const instances = await cloudlocalApp.client.getAllInstances(
                    subscription.id,
                    'europe'
                );
                expect(instances)
                    .toHaveLength(0);
            }
        );

        it(
            'should not create instances in a unknown subscription',
            async() => {
                await expect(cloudlocalApp.client.createInstances(
                    uuid(),
                    'europe',
                    instancesToCreate
                ))
                    .rejects
                    .toThrowError(SubscriptionCloudlocalNotFoundError);
            }
        );

        it(
            'should not create instances in a unknown region',
            async() => {
                await expect(cloudlocalApp.client.createInstances(
                    subscription.id,
                    'paradise',
                    instancesToCreate
                ))
                    .rejects
                    .toThrowError(RegionCloudlocalNotFoundError);
            }
        );

        it(
            'should not create instances with empty payload',
            async() => {
                const payload: any = null;

                await expect(cloudlocalApp.client.createInstances(
                    subscription.id,
                    'europe',
                    payload
                ))
                    .rejects
                    .toThrowError(ValidationError);
            }
        );

        it(
            'should not create instances with missing fields',
            async() => {
                const payload: any = {
                    size: 'small',
                    imageId: image.id,
                };

                await expect(cloudlocalApp.client.createInstances(
                    subscription.id,
                    'europe',
                    payload
                ))
                    .rejects
                    .toThrowError(ValidationError);
            }
        );

        it(
            'should not create instances with wrong type fields',
            async() => {
                const payload: any = {
                    ids: 10,
                    size: 'small',
                    imageId: image.id,
                };

                await expect(cloudlocalApp.client.createInstances(
                    subscription.id,
                    'europe',
                    payload
                ))
                    .rejects
                    .toThrowError(ValidationError);
            }
        );

        it(
            'should not create instances with empty ids',
            async() => {
                const payload: IInstancesCloudlocalToCreate = {
                    ids: [],
                    size: 'small',
                    imageId: image.id,
                };

                await expect(cloudlocalApp.client.createInstances(
                    subscription.id,
                    'europe',
                    payload
                ))
                    .rejects
                    .toThrowError(ValidationError);
            }
        );

        it(
            'should not create instances with unknown size in region',
            async() => {
                const payload: IInstancesCloudlocalToCreate = {
                    ids: [
                        randomName(),
                    ],
                    size: 'xxl',
                    imageId: image.id,
                };

                await expect(cloudlocalApp.client.createInstances(
                    subscription.id,
                    'europe',
                    payload
                ))
                    .rejects
                    .toThrowError(RegionSizeCloudlocalNotFoundError);
            }
        );

        it(
            'should not create instances with unknown image',
            async() => {
                const payload: IInstancesCloudlocalToCreate = {
                    ids: [
                        randomName(),
                    ],
                    size: 'small',
                    imageId: uuid(),
                };

                await expect(cloudlocalApp.client.createInstances(
                    subscription.id,
                    'europe',
                    payload
                ))
                    .rejects
                    .toThrowError(ImageCloudlocalNotFoundError);
            }
        );

        it(
            'should not create instances with not ready image',
            async() => {
                const imageNotReady = await cloudlocalApp.client.createImage(
                    subscription.id,
                    'europe',
                    {
                        id: randomName(),
                        certificate: generateCertificateSelfSignedForTest(),
                    }
                );
                const payload: IInstancesCloudlocalToCreate = {
                    ids: [
                        randomName(),
                    ],
                    size: 'small',
                    imageId: imageNotReady.id,
                };

                await expect(cloudlocalApp.client.createInstances(
                    subscription.id,
                    'europe',
                    payload
                ))
                    .rejects
                    .toThrowError(InstanceCloudlocalCreateError);
            }
        );

        it(
            'should not allow too much instances creation',
            async() => {
                const ids: string[] = [];
                for (let i = 0; i < SUBSCRIPTION_LOCAL_DEFAULTS.instancesLimit + 1; ++i) {
                    ids.push(randomName());
                }

                await expect(cloudlocalApp.client.createInstances(
                    subscription.id,
                    'europe',
                    {
                        ...instancesToCreate,
                        ids,
                    }
                ))
                    .rejects
                    .toThrowError(InstanceCloudlocalCreateError);
            }
        );

        it(
            'should create instances',
            async() => {

                await cloudlocalApp.client.createInstances(
                    subscription.id,
                    'europe',
                    instancesToCreate
                );

                await waitFor(async() => {
                    const instances = await cloudlocalApp.client.getAllInstances(
                        subscription.id,
                        'europe'
                    );
                    expect(instances.length)
                        .toBe(instancesToCreate.ids.length);

                    for (const instance of instances) {
                        expect(instance.status)
                            .toBe(EInstanceCloudlocalStatus.STARTING);
                    }
                });
            }
        );

        it(
            'should not create instances with the same id',
            async() => {
                await expect(cloudlocalApp.client.createInstances(
                    subscription.id,
                    'europe',
                    instancesToCreate
                ))
                    .rejects
                    .toThrowError(InstanceCloudlocalAlreadyExistsError);
            }
        );

        it(
            'should change instances status to STARTED',
            async() => {
                await cloudlocalApp.client.updateSubscription(
                    subscription.id,
                    {
                        ...SUBSCRIPTION_LOCAL_DEFAULTS,
                        transitionStartingToStarted: true,
                        transitionStoppingToStopped: false,
                    }
                );

                await waitFor(async() => {
                    const instances = await cloudlocalApp.client.getAllInstances(
                        subscription.id,
                        'europe'
                    );
                    expect(instances.length)
                        .toBe(instancesToCreate.ids.length);

                    for (const instance of instances) {
                        expect(instance.status)
                            .toBe(EInstanceCloudlocalStatus.STARTED);
                    }
                });
            }
        );

        it(
            'should change instances status to STOPPING',
            async() => {
                await cloudlocalApp.client.removeInstances(
                    subscription.id,
                    'europe',
                    instancesToCreate.ids.map((id) => ({
                        id,
                        force: false,
                    }))
                );

                await waitFor(async() => {
                    const instances = await cloudlocalApp.client.getAllInstances(
                        subscription.id,
                        'europe'
                    );
                    expect(instances.length)
                        .toBe(instancesToCreate.ids.length);

                    for (const instance of instances) {
                        expect(instance.status)
                            .toBe(EInstanceCloudlocalStatus.STOPPING);
                    }
                });
            }
        );

        it(
            'should remove all instances',
            async() => {
                await cloudlocalApp.client.updateSubscription(
                    subscription.id,
                    {
                        ...SUBSCRIPTION_LOCAL_DEFAULTS,
                        transitionStartingToStarted: true,
                        transitionStoppingToStopped: true,
                    }
                );

                await waitFor(async() => {
                    const instances = await cloudlocalApp.client.getAllInstances(
                        subscription.id,
                        'europe'
                    );
                    expect(instances.length)
                        .toBe(0);
                });
            }
        );
    }
);
