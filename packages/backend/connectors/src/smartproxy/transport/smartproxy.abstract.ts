import { ATransportResidentialService } from '@scrapoxy/backend-sdk';
import type { IncomingMessage } from 'http';


export abstract class ATransportSmartproxyService extends ATransportResidentialService {
    protected override parseBodyError(
        r: IncomingMessage, callback: (err: Error) => void
    ) {
        switch (r.statusCode) {
            case 400: {
                callback(new Error('Invalid proxy parameters'));

                return;
            }

            case 403: {
                callback(new Error('Blacklisted domain'));

                return;
            }

            case 407: {
                callback(new Error('Invalid credentials'));

                return;
            }

            default: {
                super.parseBodyError(
                    r,
                    callback
                );

                return;
            }
        }
    }
}
