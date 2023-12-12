import { Injectable } from '@nestjs/common';
import { CommanderFrontendService } from './frontend.service';
import {
    ProjectInaccessibleError,
    UserProfileIncompleteError,
} from '../../commander-client';
import type {
    CanActivate,
    ExecutionContext,
} from '@nestjs/common';
import type { IUserToken } from '@scrapoxy/common';


@Injectable()
export class CommanderFrontendRoleGuard implements CanActivate {
    constructor(private readonly commander: CommanderFrontendService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp()
            .getRequest();
        const user = req.user as IUserToken;

        if (!user.complete) {
            throw new UserProfileIncompleteError(user.id);
        }

        const projectId = req.params.projectId;
        const canAccess = await this.commander.canUserAccessToProject(
            projectId,
            user.id
        );

        if (!canAccess) {
            throw new ProjectInaccessibleError(
                projectId,
                user.id
            );
        }

        return true;
    }
}
