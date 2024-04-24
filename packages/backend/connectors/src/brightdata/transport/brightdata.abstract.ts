import { ATransportResidentialService } from '@scrapoxy/backend-sdk';
import type { IncomingMessage } from 'http';


export abstract class ATransportBrightdataService extends ATransportResidentialService {
    protected override parseBodyError(
        r: IncomingMessage, callback: (err: Error) => void
    ) {
        for (const headerName of [
            'x-brd-error', 'x-luminati-error',
        ]) {
            const error = r.headers[ headerName ] as string;

            if (error && error.length > 0) {
                callback(new Error(error));

                return;
            }
        }

        super.parseBodyError(
            r,
            callback
        );
    }
}
