import { Server } from 'net';
import {
    BadRequestException,
    Body,
    Controller,
    Get,
    HttpCode,
    Injectable,
    Module,
    ParseIntPipe,
    Post,
    Query,
    Req,
    Res,
    UseInterceptors,
} from '@nestjs/common';
import { validate } from '@scrapoxy/backend-sdk';
import {
    ONE_SECOND_IN_MS,
    sleep,
} from '@scrapoxy/common';
import * as Joi from 'joi';
import { Observable } from 'rxjs';
import {
    GeneratorCheckStream,
    GeneratorStream,
} from '../../stream-generator';
import type {
    CallHandler,
    ExecutionContext,
    NestInterceptor,
} from '@nestjs/common';
import type {
    Request,
    Response,
} from 'express';
import type { AddressInfo } from 'net';


interface IRememberPayload {
    type: string;
    content: any;
}


const schemaRemember = Joi.object({
    type: Joi.string()
        .required(),
    content: Joi.any()
        .required(),
});


@Injectable()
class CheckIfHostHeaderExistsInterceptor implements NestInterceptor {
    intercept(
        context: ExecutionContext, next: CallHandler
    ): Observable<any> {
        const request = context.switchToHttp()
            .getRequest();

        if (!request.headers.host) {
            throw new BadRequestException('Not host header found');
        }

        return next
            .handle();
    }
}


@Controller()
@UseInterceptors(CheckIfHostHeaderExistsInterceptor)
class WebController {
    private data: IRememberPayload | undefined = void 0;

    @Get('mirror/headers')
    mirrorHeaders(@Req() req: Request) {
        return req.headers;
    }

    @Post('mirror/payload')
    @HttpCode(200)
    mirrorPayload(@Body() data: any) {
        return data;
    }

    @Get('socketdestroy')
    destroySocket(@Res() res: Response) {
        if (res.socket) {
            res.socket.destroy();
        }
    }

    @Post('timeout')
    async timeoutPost(): Promise<string> {
        await sleep(ONE_SECOND_IN_MS);

        return 'never_sent';
    }

    @Get('file/big')
    sendLargeFile(
    @Query(
        'size',
        ParseIntPipe
    ) size: number,
        @Res() res: Response
    ) {
        res.writeHead(
            200,
            {
                'Content-Type': 'application/octet-stream',
                'Content-Length': size,
            }
        );

        new GeneratorStream({
            maxSize: size,
        })
            .pipe(res);
    }

    @Post('file/big')
    @HttpCode(200)
    async receiveLargeFile(
    @Query(
        'size',
        ParseIntPipe
    ) size: number,
        @Req() req: Request
    ) {
        await GeneratorCheckStream.from(
            req,
            {
                maxSize: size,
            }
        );
    }

    @Get('file/slow')
    sendFileSlowly(
    @Query(
        'size',
        ParseIntPipe
    ) size: number,
        @Query(
            'interval',
            ParseIntPipe
        ) interval: number,
        @Query(
            'sleep',
            ParseIntPipe
        ) sleepDelay: number,
        @Res() res: Response
    ) {
        res.writeHead(
            200,
            {
                'Content-Type': 'application/octet-stream',
                'Content-Length': size,
            }
        );

        new GeneratorStream({
            maxSize: size,
            delay: {
                interval,
                sleep: sleepDelay,
            },
        })
            .pipe(res);
    }

    @Get('remember')
    rememberRead(@Res() res: Response) {
        if (!this.data) {
            throw new BadRequestException('No data remembered');
        }

        res.set(
            'Content-Type',
            this.data.type
        );

        res.send(this.data.content);
    }

    @Post('remember')
    @HttpCode(204)
    async rememberWrite(@Body() data: IRememberPayload) {
        try {
            await validate(
                schemaRemember,
                data
            );

            this.data = data;
        } catch (err: any) {
            throw new BadRequestException(err.message);
        }
    }
}


@Module({
    controllers: [
        WebController,
    ],
})
export class WebModule {}


export class WebServer {
    constructor(private readonly server: Server) {}

    get port(): number | null {
        const address: AddressInfo = this.server.address() as AddressInfo;

        if (!address) {
            return null;
        }

        return address.port;
    }

    listen(port = 0): Promise<number> {
        return new Promise<number>((
            resolve, reject
        ) => {
            this.server.on(
                'error',
                (err: any) => {
                    reject(new Error(`Webserver cannot listen at port ${port} : ${err.message}`));
                }
            );

            this.server.on(
                'listening',
                () => {
                    resolve(this.port as number);
                }
            );

            this.server.listen(port);
        });
    }

    close(): Promise<void> {
        return new Promise<void>((
            resolve, reject
        ) => {
            this.server.close((err: Error | undefined) => {
                if (err) {
                    reject(err);

                    return;
                }

                resolve();
            });
        });
    }
}
