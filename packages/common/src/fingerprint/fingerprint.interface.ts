export const FINGERPRINT_SWAGGER_PROPS = {
    ip: {
        type: 'string',
        description: 'IP address of the proxy',
        example: '13.38.69.243',
    },
    useragent: {
        type: 'string',
        nullable: true,
        description: 'User agent for the fingerprinted request',
        example: 'Mozilla/5.0 (Linux x86_64; en-US) Gecko/20100101 Firefox/69.9',
    },
    asnName: {
        type: 'string',
        nullable: true,
        description: 'Name of the Autonomous System Number (ASN) of this IP address',
        example: 'AMAZON-02',
    },
    asnNetwork: {
        type: 'string',
        nullable: true,
        description: 'Network of this IP address',
        example: '13.36.0.0/14',
    },
    continentCode: {
        type: 'string',
        nullable: true,
        description: '2-letter continent code of the IP Address',
        example: 'EU',
    },
    continentName: {
        type: 'string',
        nullable: true,
        description: 'Continent name of the IP Address',
        example: 'Europe',
    },
    countryCode: {
        type: 'string',
        nullable: true,
        description: '2-letter country code of the IP Address',
        example: 'FR',
    },
    countryName: {
        type: 'string',
        nullable: true,
        description: 'Country name of the IP Address',
        example: 'France',
    },
    cityName: {
        type: 'string',
        nullable: true,
        description: 'City name of the IP Address',
        example: 'Paris',
    },
    timezone: {
        type: 'string',
        nullable: true,
        description: 'Timezone of the IP Address',
        example: 'Europe/Paris',
    },
    latitude: {
        type: 'number',
        nullable: true,
        description: 'Latitude of the IP Address',
        example: 48.8323,
    },
    longitude: {
        type: 'number',
        nullable: true,
        description: 'Longitude of the IP Address',
        example: 2.4075,
    },
};


export interface IFingerprint {
    ip: string;
    useragent: string | null;
    asnName: string | null;
    asnNetwork: string | null;
    continentCode: string | null;
    continentName: string | null;
    countryCode: string | null;
    countryName: string | null;
    cityName: string | null;
    timezone: string | null;
    latitude: number | null;
    longitude: number | null;
}


export enum EFingerprintMode {
    CONNECTOR = 'connector',
    INSTALL = 'install',
    FREEPROXIES = 'freeproxies',
}


export interface IFingerprintRequest {
    installId: string;
    mode: EFingerprintMode;
    connectorType: string;
    proxyId: string;
}


export const FINGERPRINT_RESPONSE_META = [
    'fingerprint', 'fingerprintError',
];


export const FINGERPRINT_RESPONSE_SWAGGER_PROPS = {
    fingerprint: {
        type: 'object',
        properties: FINGERPRINT_SWAGGER_PROPS,
        description: 'Fingerprint data',
    },
    fingerprintError: {
        type: 'string',
        nullable: true,
        description: 'Error message if fingerprinting failed',
        example: 'Timeout error',
    },
};


export interface IFingerprintResponse {
    fingerprint: IFingerprint | null;
    fingerprintError: string | null;
}


export interface IFingerprintOptions {
    useragent: string;
    url: string;
    followRedirectMax: number;
    retryMax: number;
}
