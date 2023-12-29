import { Logger } from '@nestjs/common';
import {
    generateCertificateSelfSignedForTest,
    ValidationError,
} from '@scrapoxy/backend-sdk';
import { waitFor } from '@scrapoxy/backend-test-sdk';
import {
    CloudlocalApp,
    ImageCloudlocalAlreadyExistsError,
    ImageCloudlocalNotFoundError,
    RegionCloudlocalNotFoundError,
    SUBSCRIPTION_LOCAL_DEFAULTS,
    SubscriptionCloudlocalNotFoundError,
    SubscriptionCloudlocalRemoveError,
} from '@scrapoxy/cloudlocal';
import { randomName } from '@scrapoxy/common';
import { EImageCloudlocalStatus } from '@scrapoxy/connector-cloudlocal-sdk';
import { v4 as uuid } from 'uuid';
import type {
    IImageCloudlocalToCreate,
    IImageCloudlocalToUpdate,
    IImageCloudlocalView,
    ISubscriptionCloudlocalView,
} from '@scrapoxy/connector-cloudlocal-sdk';


describe(
    'Cloud Local - Images',
    () => {
        const
            cloudlocalApp = new CloudlocalApp(new Logger()),
            imageToCreate: IImageCloudlocalToCreate = {
                id: randomName(),
                certificate: generateCertificateSelfSignedForTest(),
            },
            imageToUpdate: IImageCloudlocalToUpdate = {
                certificate: generateCertificateSelfSignedForTest(),
            };
        let
            image: IImageCloudlocalView,
            subscription: ISubscriptionCloudlocalView;

        beforeAll(async() => {
            // Start local cloud
            await cloudlocalApp.start();

            // Create subscription
            subscription = await cloudlocalApp.client.createSubscription({
                ...SUBSCRIPTION_LOCAL_DEFAULTS,
                id: uuid(),
            });
        });

        afterAll(async() => {
            await cloudlocalApp.close();
        });

        it(
            'should not have any image',
            async() => {
                const images = await cloudlocalApp.client.getAllImages(
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
                await expect(cloudlocalApp.client.createImage(
                    uuid(),
                    'europe',
                    imageToCreate
                ))
                    .rejects
                    .toThrowError(SubscriptionCloudlocalNotFoundError);
            }
        );

        it(
            'should not create an image in a unknown region',
            async() => {
                await expect(cloudlocalApp.client.createImage(
                    subscription.id,
                    'paradise',
                    imageToCreate
                ))
                    .rejects
                    .toThrowError(RegionCloudlocalNotFoundError);
            }
        );

        it(
            'should not create an image with empty payload',
            async() => {
                const payload: any = null;

                await expect(cloudlocalApp.client.createImage(
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

                await expect(cloudlocalApp.client.createImage(
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

                await expect(cloudlocalApp.client.createImage(
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

                image = await cloudlocalApp.client.createImage(
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
                    .toBe(EImageCloudlocalStatus.CREATING);

                await waitFor(async() => {
                    const imageFound = await cloudlocalApp.client.getImage(
                        subscription.id,
                        'europe',
                        image.id
                    );
                    expect(imageFound.status)
                        .toBe(EImageCloudlocalStatus.READY);
                });
            }
        );

        it(
            'should not create an image with the same id',
            async() => {
                await expect(cloudlocalApp.client.createImage(
                    subscription.id,
                    'europe',
                    imageToCreate
                ))
                    .rejects
                    .toThrowError(ImageCloudlocalAlreadyExistsError);
            }
        );

        it(
            'should not update an image in a unknown subscription',
            async() => {

                await expect(cloudlocalApp.client.updateImage(
                    subscription.id,
                    'europe',
                    uuid(),
                    imageToUpdate
                ))
                    .rejects
                    .toThrowError(ImageCloudlocalNotFoundError);
            }
        );

        it(
            'should not update an image in a unknown region',
            async() => {

                await expect(cloudlocalApp.client.updateImage(
                    subscription.id,
                    'paradise',
                    image.id,
                    imageToUpdate
                ))
                    .rejects
                    .toThrowError(RegionCloudlocalNotFoundError);
            }
        );

        it(
            'should not update an unknown image',
            async() => {

                await expect(cloudlocalApp.client.updateImage(
                    subscription.id,
                    'europe',
                    uuid(),
                    imageToUpdate
                ))
                    .rejects
                    .toThrowError(ImageCloudlocalNotFoundError);
            }
        );

        it(
            'should not update an image with empty payload',
            async() => {
                const payload: any = null;

                await expect(cloudlocalApp.client.updateImage(
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

                await expect(cloudlocalApp.client.updateImage(
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
                await cloudlocalApp.client.updateImage(
                    subscription.id,
                    'europe',
                    image.id,
                    imageToUpdate
                );

                const imageFound = await cloudlocalApp.client.getImage(
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

                await expect(cloudlocalApp.client.removeImage(
                    uuid(),
                    'europe',
                    image.id
                ))
                    .rejects
                    .toThrowError(SubscriptionCloudlocalNotFoundError);
            }
        );

        it(
            'should not remove an image in a unknown region',
            async() => {

                await expect(cloudlocalApp.client.removeImage(
                    subscription.id,
                    'paradise',
                    image.id
                ))
                    .rejects
                    .toThrowError(RegionCloudlocalNotFoundError);
            }
        );

        it(
            'should not remove an unknown image',
            async() => {

                await expect(cloudlocalApp.client.removeImage(
                    subscription.id,
                    'europe',
                    uuid()
                ))
                    .rejects
                    .toThrowError(ImageCloudlocalNotFoundError);
            }
        );

        it(
            'should not remove a subscription with an existing image',
            async() => {
                await expect(cloudlocalApp.client.removeSubscription(subscription.id))
                    .rejects
                    .toThrowError(SubscriptionCloudlocalRemoveError);
            }
        );

        it(
            'should remove an image',
            async() => {
                await cloudlocalApp.client.removeImage(
                    subscription.id,
                    'europe',
                    image.id
                );

                const images = await cloudlocalApp.client.getAllImages(
                    subscription.id,
                    'europe'
                );
                expect(images)
                    .toHaveLength(0);
            }
        );
    }
);
