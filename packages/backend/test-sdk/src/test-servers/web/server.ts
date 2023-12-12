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
import {
    ONE_SECOND_IN_MS,
    sleep,
} from '@scrapoxy/common';
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
