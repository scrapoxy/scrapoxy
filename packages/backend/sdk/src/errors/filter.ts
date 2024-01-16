import {
    Catch,
    Logger,
} from '@nestjs/common';
import { HttpBaseException } from './errors';
import type {
    ArgumentsHost,
    ExceptionFilter,
} from '@nestjs/common';
import type {
    Request,
    Response,
} from 'express';


@Catch(HttpBaseException)
export class LogExceptionFilter implements ExceptionFilter {
    catch(
        exception: HttpBaseException, host: ArgumentsHost
    ) {
        const ctx = host.switchToHttp();

        if (exception.loggable) {
            const request = ctx.getRequest<Request>();

            Logger.error(
                `${exception.message} (${request.method} ${request.url})`,
                exception.constructor.name
            );
        }

        const response = ctx.getResponse<Response>();

        response
            .status(exception.getStatus())
            .json(exception.getResponse());
    }
}
