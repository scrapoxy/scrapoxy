export interface ICertificate {
    cert: string;
    key: string;
}


export interface ICertificateInfo {
    certificate: ICertificate;
    startAt: number;
    endAt: number;
}


export interface ICertificateToRenew {
    durationInMs: number;
}


export interface ICertificateToCreate {
    hostname: string;
    certificate: ICertificate;
}
