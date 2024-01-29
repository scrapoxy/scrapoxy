import { Logger } from '@nestjs/common';
import {
    DatacenterLocalApp,
    DatacenterLocalNotFoundError,
    generateCertificateSelfSignedForTest,
    ImageDatacenterLocalAlreadyExistsError,
    RegionDatacenterLocalNotFoundError,
    SUBSCRIPTION_LOCAL_DEFAULTS,
    SubscriptionDatacenterLocalNotFoundError,
    SubscriptionDatacenterLocalRemoveError,
    ValidationError,
} from '@scrapoxy/backend-sdk';
import { waitFor } from '@scrapoxy/backend-test-sdk';
import {
    EImageDatacenterLocalStatus,
    randomName,
} from '@scrapoxy/common';
import { v4 as uuid } from 'uuid';
import type {
    IImageDatacenterLocalToCreate,
    IImageDatacenterLocalToUpdate,
    IImageDatacenterLocalView,
    ISubscriptionDatacenterLocalView,
} from '@scrapoxy/common';


describe(
    'Datacenter Local - Images',
    () => {
        const
            datacenterLocalApp = new DatacenterLocalApp(new Logger()),
            imageToCreate: IImageDatacenterLocalToCreate = {
                id: randomName(),
                certificate: generateCertificateSelfSignedForTest(),
            },
            imageToUpdate: IImageDatacenterLocalToUpdate = {
                certificate: generateCertificateSelfSignedForTest(),
            };
        let
            image: IImageDatacenterLocalView,
            subscription: ISubscriptionDatacenterLocalView;

        beforeAll(async() => {
            // Start local datacenter
            await datacenterLocalApp.start();

            // Create subscription
            subscription = await datacenterLocalApp.client.createSubscription({
                ...SUBSCRIPTION_LOCAL_DEFAULTS,
                id: uuid(),
            });
        });

        afterAll(async() => {
            await datacenterLocalApp.close();
        });

        it(
            'should not have any image',
            async() => {
                const images = await datacenterLocalApp.client.getAllImages(
                    subscription.id,
                    'europe'
                );
                expect(images)
                    .toHaveLength(0);
            }
        );

        it(
            'should not create an image in a unknown subscription',
            async() => {
                await expect(datacenterLocalApp.client.createImage(
                    uuid(),
                    'europe',
                    imageToCreate
                ))
                    .rejects
                    .toThrowError(SubscriptionDatacenterLocalNotFoundError);
            }
        );

        it(
            'should not create an image in a unknown region',
            async() => {
                await expect(datacenterLocalApp.client.createImage(
                    subscription.id,
                    'paradise',
                    imageToCreate
                ))
                    .rejects
                    .toThrowError(RegionDatacenterLocalNotFoundError);
            }
        );

        it(
            'should not create an image with empty payload',
            async() => {
                const payload: any = null;

                await expect(datacenterLocalApp.client.createImage(
                    subscription.id,
                    'europe',
                    payload
                ))
                    .rejects
                    .toThrowError(ValidationError);
            }
        );

        it(
            'should not create an image with missing fields',
            async() => {
                const payload: any = {
                    certificate: generateCertificateSelfSignedForTest(),
                };

                await expect(datacenterLocalApp.client.createImage(
                    subscription.id,
                    'europe',
                    payload
                ))
                    .rejects
                    .toThrowError(ValidationError);
            }
        );

        it(
            'should not create an image with wrong type fields',
            async() => {
                const payload: any = {
                    id: randomName(),
                    certificate: 'mycertificate',
                };

                await expect(datacenterLocalApp.client.createImage(
                    subscription.id,
                    'europe',
                    payload
                ))
                    .rejects
                    .toThrowError(ValidationError);
            }
        );

        it(
            'should create a ready image',
            async() => {

                image = await datacenterLocalApp.client.createImage(
                    subscription.id,
                    'europe',
                    imageToCreate
                );

                expect(image.id)
                    .toBe(imageToCreate.id);
                expect(image.subscriptionId)
                    .toBe(subscription.id);
                expect(image.region)
                    .toBe('europe');
                expect(image.status)
                    .toBe(EImageDatacenterLocalStatus.CREATING);

                await waitFor(async() => {
                    const imageFound = await datacenterLocalApp.client.getImage(
                        subscription.id,
                        'europe',
                        image.id
                    );
                    expect(imageFound.status)
                        .toBe(EImageDatacenterLocalStatus.READY);
                });
            }
        );

        it(
            'should not create an image with the same id',
            async() => {
                await expect(datacenterLocalApp.client.createImage(
                    subscription.id,
                    'europe',
                    imageToCreate
                ))
                    .rejects
                    .toThrowError(ImageDatacenterLocalAlreadyExistsError);
            }
        );

        it(
            'should not update an image in a unknown subscription',
            async() => {

                await expect(datacenterLocalApp.client.updateImage(
                    subscription.id,
                    'europe',
                    uuid(),
                    imageToUpdate
                ))
                    .rejects
                    .toThrowError(DatacenterLocalNotFoundError);
            }
        );

        it(
            'should not update an image in a unknown region',
            async() => {

                await expect(datacenterLocalApp.client.updateImage(
                    subscription.id,
                    'paradise',
                    image.id,
                    imageToUpdate
                ))
                    .rejects
                    .toThrowError(RegionDatacenterLocalNotFoundError);
            }
        );

        it(
            'should not update an unknown image',
            async() => {

                await expect(datacenterLocalApp.client.updateImage(
                    subscription.id,
                    'europe',
                    uuid(),
                    imageToUpdate
                ))
                    .rejects
                    .toThrowError(DatacenterLocalNotFoundError);
            }
        );

        it(
            'should not update an image with empty payload',
            async() => {
                const payload: any = null;

                await expect(datacenterLocalApp.client.updateImage(
                    subscription.id,
                    'europe',
                    image.id,
                    payload
                ))
                    .rejects
                    .toThrowError(ValidationError);
            }
        );

        it(
            'should not update an image with missing fields',
            async() => {
                const payload: any = {
                    notafield: 'field',
                };

                await expect(datacenterLocalApp.client.updateImage(
                    subscription.id,
                    'europe',
                    image.id,
                    payload
                ))
                    .rejects
                    .toThrowError(ValidationError);
            }
        );

        it(
            'should update an image',
            async() => {
                await datacenterLocalApp.client.updateImage(
                    subscription.id,
                    'europe',
                    image.id,
                    imageToUpdate
                );

                const imageFound = await datacenterLocalApp.client.getImage(
                    subscription.id,
                    'europe',
                    image.id
                );

                expect(imageFound.certificate)
                    .toEqual(imageToUpdate.certificate);
            }
        );

        it(
            'should not remove an image in a unknown subscription',
            async() => {

                await expect(datacenterLocalApp.client.removeImage(
                    uuid(),
                    'europe',
                    image.id
                ))
                    .rejects
                    .toThrowError(SubscriptionDatacenterLocalNotFoundError);
            }
        );

        it(
            'should not remove an image in a unknown region',
            async() => {

                await expect(datacenterLocalApp.client.removeImage(
                    subscription.id,
                    'paradise',
                    image.id
                ))
                    .rejects
                    .toThrowError(RegionDatacenterLocalNotFoundError);
            }
        );

        it(
            'should not remove an unknown image',
            async() => {

                await expect(datacenterLocalApp.client.removeImage(
                    subscription.id,
                    'europe',
                    uuid()
                ))
                    .rejects
                    .toThrowError(DatacenterLocalNotFoundError);
            }
        );

        it(
            'should not remove a subscription with an existing image',
            async() => {
                await expect(datacenterLocalApp.client.removeSubscription(subscription.id))
                    .rejects
                    .toThrowError(SubscriptionDatacenterLocalRemoveError);
            }
        );

        it(
            'should remove an image',
            async() => {
                await datacenterLocalApp.client.removeImage(
                    subscription.id,
                    'europe',
                    image.id
                );

                const images = await datacenterLocalApp.client.getAllImages(
                    subscription.id,
                    'europe'
                );
                expect(images)
                    .toHaveLength(0);
            }
        );
    }
);
