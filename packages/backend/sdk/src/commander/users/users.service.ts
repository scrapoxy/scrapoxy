import {
    Injectable,
    Logger,
} from '@nestjs/common';
import {
    isUserComplete,
    toUserView,
} from '@scrapoxy/common';
import {
    schemaUserToCreate,
    schemaUserToUpdate,
} from './users.validation';
import { UserNotFoundError } from '../../errors';
import { validate } from '../../helpers';
import { StorageprovidersService } from '../../storages';
import type {
    IProfile,
    IUserData,
    IUserToCreate,
    IUserToUpdate,
    IUserView,
} from '@scrapoxy/common';


@Injectable()
export class CommanderUsersService {
    private readonly logger = new Logger(CommanderUsersService.name);

    constructor(private readonly storageproviders: StorageprovidersService) {
    }

    async getUserById(userId: string): Promise<IUserView> {
        this.logger.debug(`getUserById(): userId=${userId}`);

        const user = await this.storageproviders.storage.getUserById(userId);

        return toUserView(user);
    }


    async getOrCreateUserFromProfile(profile: IProfile): Promise<IUserView> {
        this.logger.debug(`getOrCreateUserFromProfile(): profile.id=${profile.id}`);

        try {
            const user = await this.getUserById(profile.id);

            return user;
        } catch (err: any) {
            if (err instanceof UserNotFoundError) {
                const user = await this.createUser(profile);

                return user;
            }

            throw err;
        }
    }

    async createUser(userToCreate: IUserToCreate): Promise<IUserView> {
        this.logger.debug(`createUser(): userToCreate.id=${userToCreate.id}`);

        await validate(
            schemaUserToCreate,
            userToCreate
        );

        if (userToCreate.email && userToCreate.email.length > 0) {
            await this.storageproviders.storage.checkIfUserEmailExists(userToCreate.email);
        }

        const user: IUserData = {
            ...userToCreate,
            complete: isUserComplete(userToCreate),
        };
        await this.storageproviders.storage.createUser(user);

        return toUserView(user);
    }

    async updateUser(
        userId: string, userToUpdate: IUserToUpdate
    ): Promise<IUserView> {
        this.logger.debug(`updateUser(): userId=${userId}`);

        await validate(
            schemaUserToUpdate,
            userToUpdate
        );

        if (userToUpdate.email && userToUpdate.email.length > 0) {
            await this.storageproviders.storage.checkIfUserEmailExists(
                userToUpdate.email,
                userId
            );
        }

        const user = await this.storageproviders.storage.getUserById(userId);

        Object.assign(
            user,
            userToUpdate,
            {
                complete: isUserComplete(user),
            }
        );

        await this.storageproviders.storage.updateUser(user);

        return toUserView(user);
    }
}
