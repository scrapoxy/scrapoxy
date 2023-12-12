export interface IProbeService {
    type: string;

    alive: boolean;
}


export interface IProbeStatus {
    [key: string]: boolean;
}
