import { ECommanderError } from '@scrapoxy/common';


export class ClientError extends Error {
    constructor(
        public readonly id: ECommanderError, message: string
    ) {
        super(message);
    }
}
