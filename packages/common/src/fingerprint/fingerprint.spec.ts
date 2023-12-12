import { fingerprintEquals } from './fingerprint.helpers';
import type { IFingerprint } from './fingerprint.interface';


const
    fpA: IFingerprint = {
        ip: '1.2.3.4',
        asnName: 'my asn',
        asnNetwork: 'my asn network',
        cityName: 'Paris',
        continentCode: 'EU',
        continentName: 'Europe',
        countryCode: 'FR',
        countryName: 'France',
        latitude: 48.85889,
        longitude: 2.320041,
        timezone: 'Europe/Paris',
        useragent: 'Scrapoxy/1.2.3',
    },
    fpB: IFingerprint = {
        ip: '5.6.7.8',
        asnName: 'my asn 2',
        asnNetwork: 'my asn network 2',
        cityName: 'Washington',
        continentCode: 'NA',
        continentName: 'North America',
        countryCode: 'US',
        countryName: 'USA',
        latitude: 38.895037,
        longitude: -77.036543,
        timezone: 'Europe/Paris',
        useragent: 'Scrapoxy/1.2.3',
    };


describe(
    'Proxy Fingerprint Equals',
    () => {
        it(
            'empty should be true',
            () => {
                expect(fingerprintEquals(
                    null,
                    null
                ))
                    .toBeTruthy();
            }
        );

        it(
            'empty and not empty should be false',
            () => {
                expect(fingerprintEquals(
                    null,
                    fpB
                ))
                    .toBeFalsy();

                expect(fingerprintEquals(
                    fpA,
                    null
                ))
                    .toBeFalsy();
            }
        );

        it(
            'same IPs should be true',
            () => {
                const fpA2 = {
                    ...fpA,
                    useragent: 'Other stuff',
                };
                expect(fingerprintEquals(
                    fpA,
                    fpA2
                ))
                    .toBeTruthy();
            }
        );

        it(
            'diffents IPs should be false',
            () => {
                expect(fingerprintEquals(
                    fpA,
                    fpB
                ))
                    .toBeFalsy();
            }
        );

    }
);
