import { EventEmitter } from 'events';
import type { LoggerService } from '@nestjs/common';
import type { IProxyLogger } from '@scrapoxy/proxy-sdk';


let traceEmitOrder = 0;


export function logEmit(
    em: EventEmitter, logger: IProxyLogger, prefix: string
) {
    const emit = em.emit;
    em.emit = function(
        event: string, ...args: any[]
    ) {
        logger.log(`[${traceEmitOrder++}] ${prefix}: ${event}`);

        return emit.apply(
            em,
            [
                event, ...args,
            ]
        );
    };
}


const stackIds = new Map<number, string[]>();
const STACK_MAX_LENGTH = 50;


export function logEmitSession(
    em: EventEmitter, logger: IProxyLogger, prefix: string, id: number, cleanSession = false
) {
    const emit = em.emit;
    em.emit = function(
        event: string, ...args: any[]
    ) {
        let stack = stackIds.get(id);

        if (!stack) {
            stack = [];
            stackIds.set(
                id,
                stack
            );
        }

        if (cleanSession) {
            stack.length = 0;
        } else {
            if (stack.length >= STACK_MAX_LENGTH) {
                stack.shift();
            }
        }

        stack.push(`[${traceEmitOrder++}] ${prefix}: ${event}`);

        if (event === 'error') {
            for (const line of stack) {
                logger.log(line);
            }

            stack.length = 0;
        }

        return emit.apply(
            em,
            [
                event, ...args,
            ]
        );
    };
}


export class LoggerAdapter {
    constructor(private readonly logger: LoggerService) {
    }

    debug(message: Record<string, unknown>) {
        this.apply(
            this.logger.debug as any,
            message
        );
    }

    info(message: Record<string, unknown>) {
        this.apply(
            this.logger.log,
            message
        );
    }

    warn(message: Record<string, unknown>) {
        this.apply(
            this.logger.warn,
            message
        );
    }

    error(message: Record<string, unknown>) {
        this.apply(
            this.logger.error,
            message
        );
    }

    private apply(
        fn: (message: any, ...optionalParams: any[]) => any, message: Record<string, unknown>
    ) {
        if (message.event) {
            const text = `${message.event}: ${message.name}`;

            fn.apply(
                this,
                [
                    text,
                ]
            );
        } else {
            fn.apply(
                this.logger,
                [
                    message,
                ]
            );
        }
    }
}
