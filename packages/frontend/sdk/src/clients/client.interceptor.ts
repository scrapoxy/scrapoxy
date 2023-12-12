import {
    HttpErrorResponse,
    HttpHandler,
    HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ECommanderError } from '@scrapoxy/common';
import {
    Observable,
    throwError,
} from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ClientError } from './client.error';
import { CommanderUsersClientService } from './commander-client/users.service';
import type {
    HttpEvent,
    HttpInterceptor,
} from '@angular/common/http';


@Injectable()
export class ClientRequestsInterceptor implements HttpInterceptor {
    constructor(
        private readonly commander: CommanderUsersClientService,
        private readonly router: Router
    ) { }

    intercept(
        req: HttpRequest<any>, next: HttpHandler
    ):
        Observable<HttpEvent<any>> {
        return next.handle(req)
            .pipe(catchError((error: HttpErrorResponse) => {
                let thrownError: Error;
                const data: any = error.error;

                if (data?.id) {
                    const clientError = new ClientError(
                        data.id,
                        data.message
                    );

                    if (clientError.id === ECommanderError.UserProfileIncomplete) {
                        void this.router.navigate([
                            '/profile',
                        ]);
                    }

                    thrownError = clientError;
                } else {
                    thrownError = error;
                }

                if (error.status === 401) {
                    this.commander.logout();
                }

                return throwError(() => thrownError);
            }));
    }
}
