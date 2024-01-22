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


export interface IFingerprintPayload extends IFingerprintRequest {
    bytesReceived: number;
    bytesSent: number;
    requests: number;
}


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
