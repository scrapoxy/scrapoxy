import { Logger } from '@nestjs/common';
import { CloudlocalApp } from '@scrapoxy/cloudlocal';


describe(
    'Cloud Local - Subscriptions',
    () => {
        const cloudlocalApp = new CloudlocalApp(new Logger());

        beforeAll(async() => {
            await cloudlocalApp.start();
        });

        afterAll(async() => {
            await cloudlocalApp.close();
        });

        it(
            'should have regions',
            async() => {
                const regions = await cloudlocalApp.client.getAllRegions();
                expect(regions)
                    .toHaveLength(3);

                const region = await cloudlocalApp.client.getRegion('europe');
                expect(region.id)
                    .toBe('europe');
                expect(region.description)
                    .toBe('Europe (Paris)');
            }
        );

        it(
            'should have region sizes',
            async() => {
                const sizes = await cloudlocalApp.client.getAllRegionSizes('europe');
                expect(sizes)
                    .toHaveLength(3);

                const size = await cloudlocalApp.client.getRegionSize(
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
