import {
    Body,
    Controller,
    Get,
    HttpCode,
    Inject,
    Post,
    Put,
    Query,
    Req,
    Request,
    Response as ResponseNest,
    UseGuards,
} from '@nestjs/common';
import { toUserToken } from '@scrapoxy/common';
import { CommanderUsersDispatchGuard } from './dispatch.guard';
import { CommanderUsersTokenGuard } from './token.guard';
import { COMMANDER_USERS_MODULE_CONFIG } from './users.constants';
import { CommanderUsersService } from './users.service';
import { AuthprovidersService } from '../../auths';
import {
    JwtInvalidError,
    UserNotFoundError,
} from '../../commander-client';
import {
    addAuthCookie,
    removeAuthCookie,
} from '../../helpers';
import type { ICommanderUsersModuleConfig } from './users.module';
import type {
    IRequestProfile,
    IRequestUser,
} from '../commander.interface';
import type {
    IAuthService,
    IUserToUpdate,
    IUserView,
} from '@scrapoxy/common';
import type { Response as ResponseExpress } from 'express';


@Controller('api/users')
export class CommanderUsersController {
    constructor(
        private readonly authproviders: AuthprovidersService,
        @Inject(COMMANDER_USERS_MODULE_CONFIG)
        private readonly config: ICommanderUsersModuleConfig,
        private readonly commander: CommanderUsersService
    ) {
    }

    //////////// AUTHS ////////////
    @Get('auths')
    async getAllAuths(): Promise<IAuthService[]> {
        return this.authproviders.getAllAuths();
    }

    @Get('auths/:type')
    @UseGuards(CommanderUsersDispatchGuard)
    async loginCallbackGet(
    @Request() req: IRequestProfile, @ResponseNest({
        passthrough: true,
    }) res: ResponseExpress
    ) {
        const user = await this.commander.getOrCreateUserFromProfile(req.user);

        addAuthCookie(
            res,
            toUserToken(user),
            this.config.jwt
        );

        res.redirect('/');
    }

    @Post('auths/:type')
    @UseGuards(CommanderUsersDispatchGuard)
    @HttpCode(200)
    async loginCallbackPost(
    @Request() req: IRequestProfile, @ResponseNest({
        passthrough: true,
    }) res: ResponseExpress
    ) {
        const user = await this.commander.getOrCreateUserFromProfile(req.user);

        addAuthCookie(
            res,
            toUserToken(user),
            this.config.jwt
        );

        // No redirect on POST request
    }

    //////////// USERS ////////////
    @Get('me')
    @UseGuards(CommanderUsersTokenGuard)
    async getUserMe(@Req() req: IRequestUser): Promise<IUserView> {
        try {
            const userFound = await this.commander.getUserById(req.user.id);

            return userFound;
        } catch (err: any) {
            if (err instanceof UserNotFoundError) {
                throw new JwtInvalidError(err.message);
            }

            throw err;
        }
    }

    @Put('me')
    @UseGuards(CommanderUsersTokenGuard)
    async updateUserMe(
        @Req() req: IRequestUser, @Body() userToUpdate: IUserToUpdate
    ): Promise<IUserView> {
        const userUpdated = await this.commander.updateUser(
            req.user.id,
            userToUpdate
        );

        return userUpdated;
    }

    @Get('me/renew')
    @UseGuards(CommanderUsersTokenGuard)
    async renew(
    @Request() req: IRequestUser, @ResponseNest() res: ResponseExpress, @Query('redirect_uri') redirect: string
    ) {
        const userFound = await this.commander.getUserById(req.user.id);

        addAuthCookie(
            res,
            toUserToken(userFound),
            this.config.jwt
        );

        if ([
            '/login', '/profile',
        ].includes(redirect)) {
            res.redirect(redirect);
        } else {
            res.redirect('/login');
        }
    }

    @Get('me/logout')
    logout(@ResponseNest() res: ResponseExpress) {
        removeAuthCookie(res);

        res.redirect('/login');
    }
}
