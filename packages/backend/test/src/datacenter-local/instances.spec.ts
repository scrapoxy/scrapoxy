import { Logger } from '@nestjs/common';
import {
    generateCertificateSelfSignedForTest,
    ValidationError,
} from '@scrapoxy/backend-sdk';
import { waitFor } from '@scrapoxy/backend-test-sdk';
import { randomName } from '@scrapoxy/common';
import {
    EImageDatacenterLocalStatus,
    EInstanceDatacenterLocalStatus,
} from '@scrapoxy/connector-datacenter-local-sdk';
import {
    DatacenterLocalApp,
    DatacenterLocalNotFoundError,
    InstanceDatacenterLocalAlreadyExistsError,
    InstanceDatacenterLocalCreateError,
    RegionDatacenterLocalNotFoundError,
    RegionSizeDatacenterLocalNotFoundError,
    SUBSCRIPTION_LOCAL_DEFAULTS,
    SubscriptionDatacenterLocalNotFoundError,
} from '@scrapoxy/datacenter-local';
import { v4 as uuid } from 'uuid';
import type {
    IImageDatacenterLocalView,
    IInstancesDatacenterLocalToCreate,
    ISubscriptionDatacenterLocalView,
} from '@scrapoxy/connector-datacenter-local-sdk';


describe(
    'Datacenter Local - Instances',
    () => {
        const datacenterLocalApp = new DatacenterLocalApp(new Logger());
        let
            image: IImageDatacenterLocalView,
            instancesToCreate: IInstancesDatacenterLocalToCreate,
            subscription: ISubscriptionDatacenterLocalView;

        beforeAll(async() => {
            // Start local datacenter
            await datacenterLocalApp.start();

            // Create subscription
            subscription = await datacenterLocalApp.client.createSubscription({
                ...SUBSCRIPTION_LOCAL_DEFAULTS,
                transitionStartingToStarted: false,
                transitionStoppingToStopped: false,
                id: uuid(),
            });

            // Create image
            image = await datacenterLocalApp.client.createImage(
                subscription.id,
                'europe',
                {
                    id: randomName(),
                    certificate: generateCertificateSelfSignedForTest(),
                }
            );

            await waitFor(async() => {
                const imageFound = await datacenterLocalApp.client.getImage(
                    subscription.id,
                    'europe',
                    image.id
                );

                expect(imageFound.status)
                    .toBe(EImageDatacenterLocalStatus.READY);
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
            await datacenterLocalApp.close();
        });

        it(
            'should not have any instance',
            async() => {
                const instances = await datacenterLocalApp.client.getAllInstances(
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
                await expect(datacenterLocalApp.client.createInstances(
                    uuid(),
                    'europe',
                    instancesToCreate
                ))
                    .rejects
                    .toThrowError(SubscriptionDatacenterLocalNotFoundError);
            }
        );

        it(
            'should not create instances in a unknown region',
            async() => {
                await expect(datacenterLocalApp.client.createInstances(
                    subscription.id,
                    'paradise',
                    instancesToCreate
                ))
                    .rejects
                    .toThrowError(RegionDatacenterLocalNotFoundError);
            }
        );

        it(
            'should not create instances with empty payload',
            async() => {
                const payload: any = null;

                await expect(datacenterLocalApp.client.createInstances(
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

                await expect(datacenterLocalApp.client.createInstances(
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

                await expect(datacenterLocalApp.client.createInstances(
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
                const payload: IInstancesDatacenterLocalToCreate = {
                    ids: [],
                    size: 'small',
                    imageId: image.id,
                };

                await expect(datacenterLocalApp.client.createInstances(
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
                const payload: IInstancesDatacenterLocalToCreate = {
                    ids: [
                        randomName(),
                    ],
                    size: 'xxl',
                    imageId: image.id,
                };

                await expect(datacenterLocalApp.client.createInstances(
                    subscription.id,
                    'europe',
                    payload
                ))
                    .rejects
                    .toThrowError(RegionSizeDatacenterLocalNotFoundError);
            }
        );

        it(
            'should not create instances with unknown image',
            async() => {
                const payload: IInstancesDatacenterLocalToCreate = {
                    ids: [
                        randomName(),
                    ],
                    size: 'small',
                    imageId: uuid(),
                };

                await expect(datacenterLocalApp.client.createInstances(
                    subscription.id,
                    'europe',
                    payload
                ))
                    .rejects
                    .toThrowError(DatacenterLocalNotFoundError);
            }
        );

        it(
            'should not create instances with not ready image',
            async() => {
                const imageNotReady = await datacenterLocalApp.client.createImage(
                    subscription.id,
                    'europe',
                    {
                        id: randomName(),
                        certificate: generateCertificateSelfSignedForTest(),
                    }
                );
                const payload: IInstancesDatacenterLocalToCreate = {
                    ids: [
                        randomName(),
                    ],
                    size: 'small',
                    imageId: imageNotReady.id,
                };

                await expect(datacenterLocalApp.client.createInstances(
                    subscription.id,
                    'europe',
                    payload
                ))
                    .rejects
                    .toThrowError(InstanceDatacenterLocalCreateError);
            }
        );

        it(
            'should not allow too much instances creation',
            async() => {
                const ids: string[] = [];
                for (let i = 0; i < SUBSCRIPTION_LOCAL_DEFAULTS.instancesLimit + 1; ++i) {
                    ids.push(randomName());
                }

                await expect(datacenterLocalApp.client.createInstances(
                    subscription.id,
                    'europe',
                    {
                        ...instancesToCreate,
                        ids,
                    }
                ))
                    .rejects
                    .toThrowError(InstanceDatacenterLocalCreateError);
            }
        );

        it(
            'should create instances',
            async() => {

                await datacenterLocalApp.client.createInstances(
                    subscription.id,
                    'europe',
                    instancesToCreate
                );

                await waitFor(async() => {
                    const instances = await datacenterLocalApp.client.getAllInstances(
                        subscription.id,
                        'europe'
                    );
                    expect(instances.length)
                        .toBe(instancesToCreate.ids.length);

                    for (const instance of instances) {
                        expect(instance.status)
                            .toBe(EInstanceDatacenterLocalStatus.STARTING);
                    }
                });
            }
        );

        it(
            'should not create instances with the same id',
            async() => {
                await expect(datacenterLocalApp.client.createInstances(
                    subscription.id,
                    'europe',
                    instancesToCreate
                ))
                    .rejects
                    .toThrowError(InstanceDatacenterLocalAlreadyExistsError);
            }
        );

        it(
            'should change instances status to STARTED',
            async() => {
                await datacenterLocalApp.client.updateSubscription(
                    subscription.id,
                    {
                        ...SUBSCRIPTION_LOCAL_DEFAULTS,
                        transitionStartingToStarted: true,
                        transitionStoppingToStopped: false,
                    }
                );

                await waitFor(async() => {
                    const instances = await datacenterLocalApp.client.getAllInstances(
                        subscription.id,
                        'europe'
                    );
                    expect(instances.length)
                        .toBe(instancesToCreate.ids.length);

                    for (const instance of instances) {
                        expect(instance.status)
                            .toBe(EInstanceDatacenterLocalStatus.STARTED);
                    }
                });
            }
        );

        it(
            'should change instances status to STOPPING',
            async() => {
                await datacenterLocalApp.client.removeInstances(
                    subscription.id,
                    'europe',
                    instancesToCreate.ids.map((id) => ({
                        id,
                        force: false,
                    }))
                );

                await waitFor(async() => {
                    const instances = await datacenterLocalApp.client.getAllInstances(
                        subscription.id,
                        'europe'
                    );
                    expect(instances.length)
                        .toBe(instancesToCreate.ids.length);

                    for (const instance of instances) {
                        expect(instance.status)
                            .toBe(EInstanceDatacenterLocalStatus.STOPPING);
                    }
                });
            }
        );

        it(
            'should remove all instances',
            async() => {
                await datacenterLocalApp.client.updateSubscription(
                    subscription.id,
                    {
                        ...SUBSCRIPTION_LOCAL_DEFAULTS,
                        transitionStartingToStarted: true,
                        transitionStoppingToStopped: true,
                    }
                );

                await waitFor(async() => {
                    const instances = await datacenterLocalApp.client.getAllInstances(
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
