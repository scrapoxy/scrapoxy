import { Logger } from '@nestjs/common';
import { DatacenterLocalApp } from '@scrapoxy/backend-sdk';


describe(
    'Datacenter Local - Subscriptions',
    () => {
        const datacenterLocalApp = new DatacenterLocalApp(new Logger());

        beforeAll(async() => {
            await datacenterLocalApp.start();
        });

        afterAll(async() => {
            await datacenterLocalApp.close();
        });

        it(
            'should have regions',
            async() => {
                const regions = await datacenterLocalApp.client.getAllRegions();
                expect(regions)
                    .toHaveLength(3);

                const region = await datacenterLocalApp.client.getRegion('europe');
                expect(region.id)
                    .toBe('europe');
                expect(region.description)
                    .toBe('Europe (Paris)');
            }
        );

        it(
            'should have region sizes',
            async() => {
                const sizes = await datacenterLocalApp.client.getAllRegionSizes('europe');
                expect(sizes)
                    .toHaveLength(3);

                const size = await datacenterLocalApp.client.getRegionSize(
                    'europe',
                    'small'
                );
                expect(size.id)
                    .toBe('small');
                expect(size.description)
                    .toBe('Small');
                expect(size.vcpus)
                    .toBe(1);
                expect(size.memory)
                    .toBe(1024);
            }
        );
    }
);
