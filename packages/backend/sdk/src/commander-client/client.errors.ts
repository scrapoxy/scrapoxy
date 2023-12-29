import {
    BadRequestException,
    ForbiddenException,
    InternalServerErrorException,
    UnauthorizedException,
} from '@nestjs/common';
import {
    ECommanderError,
    safeJoin,
} from '@scrapoxy/common';


//////////// USERS ////////////
export class AuthNotFoundError extends UnauthorizedException {
    static readonly id = ECommanderError.AuthNotFound;

    static from(data: any): AuthNotFoundError {
        return new AuthNotFoundError(data.type);
    }

    constructor(type?: string) {
        super({
            id: AuthNotFoundError.id,
            message: `Cannot find auth (type=${type})`,
            type,
        });
    }
}


export class JwtInvalidError extends UnauthorizedException {
    static readonly id = ECommanderError.JwtInvalid;

    static from(data: any): JwtInvalidError {
        return new JwtInvalidError(data.reason);
    }

    constructor(reason: string) {
        super({
            id: JwtInvalidError.id,
            message: `JWT is invalid: ${reason}`,
            reason,
        });
    }
}


export class UserNotFoundError extends BadRequestException {
    static readonly id = ECommanderError.UserNotFound;

    static from(data: any): UserNotFoundError {
        return new UserNotFoundError(data.userId);
    }

    constructor(userId: string) {
        super({
            id: UserNotFoundError.id,
            message: `Cannot find user (userId=${userId})`,
            userId,
        });
    }
}


export class UserNotFoundByEmailError extends BadRequestException {
    static readonly id = ECommanderError.UserNotFoundByEmail;

    static from(data: any): UserNotFoundByEmailError {
        return new UserNotFoundByEmailError(data.email);
    }

    constructor(email: string) {
        super({
            id: UserNotFoundByEmailError.id,
            message: `Cannot find user (email=${email})`,
            email,
        });
    }
}


export class UserEmailAlreadyExistsError extends BadRequestException {
    static readonly id = ECommanderError.UserEmailAlreadyExists;

    static from(data: any): UserEmailAlreadyExistsError {
        return new UserEmailAlreadyExistsError(data.email);
    }

    constructor(email: string) {
        super({
            id: UserEmailAlreadyExistsError.id,
            message: `Already found user (email=${email})`,
            email,
        });
    }
}


export class UserProfileIncompleteError extends ForbiddenException {
    static readonly id = ECommanderError.UserProfileIncomplete;

    static from(data: any): UserProfileIncompleteError {
        return new UserProfileIncompleteError(data.userId);
    }

    constructor(userId: string) {
        super({
            id: UserProfileIncompleteError.id,
            message: `User has incomplete profile (userId=${userId})`,
            userId,
        });
    }
}


//////////// PROJECTS ////////////
export class ProjectNotFoundError extends BadRequestException {
    static readonly id = ECommanderError.ProjectNotFound;

    static from(data: any): ProjectNotFoundError {
        return new ProjectNotFoundError(data.projectId);
    }

    constructor(projectId: string) {
        super({
            id: ProjectNotFoundError.id,
            message: `Cannot find project (projectId=${projectId})`,
            projectId,
        });
    }
}


export class ProjectNameAlreadyExistsError extends BadRequestException {
    static readonly id = ECommanderError.ProjectNameAlreadyExists;

    static from(data: any): ProjectNameAlreadyExistsError {
        return new ProjectNameAlreadyExistsError(data.name);
    }

    constructor(name: string) {
        super({
            id: ProjectNameAlreadyExistsError.id,
            message: `Already found project (name=${name})`,
            name,
        });
    }
}


export class ProjectTokenNotFoundError extends UnauthorizedException {
    static readonly id = ECommanderError.ProjectTokenNotFound;

    static from(data: any): ProjectTokenNotFoundError {
        return new ProjectTokenNotFoundError(data.token);
    }

    constructor(token: string | undefined) {
        super({
            id: ProjectTokenNotFoundError.id,
            message: token ? `Cannot find project (token=${token})` : 'Cannot find project (no token)',
            token,
        });
    }
}


export class ProjectInaccessibleError extends ForbiddenException {
    static readonly id = ECommanderError.ProjectInaccessible;

    static from(data: any): ProjectInaccessibleError {
        return new ProjectInaccessibleError(
            data.projectId,
            data.userId
        );
    }

    constructor(
        projectId: string, userId: string
    ) {
        super({
            id: ProjectInaccessibleError.id,
            message: `User cannot access to project (userId=${userId}, projectId=${projectId})`,
            projectId,
            userId,
        });
    }
}


export class ProjectRemoveError extends BadRequestException {
    static readonly id = ECommanderError.ProjectRemove;

    static from(data: any): ProjectRemoveError {
        return new ProjectRemoveError(
            data.projectId,
            data.reason
        );
    }

    constructor(
        projectId: string,
        reason: string
    ) {
        super({
            id: ProjectRemoveError.id,
            message: `Cannot remove project (projectId=${projectId}): ${reason}`,
            projectId,
            reason,
        });
    }
}


export class ProjectUserAccessError extends BadRequestException {
    static readonly id = ECommanderError.ProjectUserAccess;

    static from(data: any): ProjectUserAccessError {
        return new ProjectUserAccessError(
            data.projectId,
            data.reason
        );
    }

    constructor(
        projectId: string,
        reason: string
    ) {
        super({
            id: ProjectUserAccessError.id,
            message: reason,
            projectId,
            reason,
        });
    }
}


//////////// CREDENTIALS ////////////
export class CredentialNotFoundError extends BadRequestException {
    static readonly id = ECommanderError.CredentialNotFound;

    static from(data: any): CredentialNotFoundError {
        return new CredentialNotFoundError(
            data.projectId,
            data.credentialId
        );
    }

    constructor(
        projectId: string, credentialId: string
    ) {
        super({
            id: CredentialNotFoundError.id,
            message: `Cannot find credential (credentialId=${credentialId}, projectId=${projectId})`,
            projectId,
            credentialId,
        });
    }
}


export class CredentialNameAlreadyExistsError extends BadRequestException {
    static readonly id = ECommanderError.CredentialNameAlreadyExists;

    static from(data: any): CredentialNameAlreadyExistsError {
        return new CredentialNameAlreadyExistsError(
            data.projectId,
            data.name
        );
    }

    constructor(
        projectId: string,
        name: string
    ) {
        super({
            id: CredentialNameAlreadyExistsError.id,
            message: `Already found credential (name=${name}, projectId=${projectId})`,
            projectId,
            name,
        });
    }
}


export class CredentialUpdateError extends BadRequestException {
    static readonly id = ECommanderError.CredentialUpdate;

    static from(data: any): CredentialUpdateError {
        return new CredentialUpdateError(
            data.projectId,
            data.credentialId,
            data.reason
        );
    }

    constructor(
        projectId: string,
        credentialId: string,
        reason: string
    ) {
        super({
            id: CredentialUpdateError.id,
            message: `Cannot update credential (credentialId=${credentialId}, projectId=${projectId}): ${reason}`,
            credentialId,
            reason,
        });
    }
}


export class CredentialRemoveError extends BadRequestException {
    static readonly id = ECommanderError.CredentialRemove;

    static from(data: any): CredentialRemoveError {
        return new CredentialRemoveError(
            data.projectId,
            data.credentialId,
            data.reason
        );
    }

    constructor(
        projectId: string,
        credentialId: string,
        reason: string
    ) {
        super({
            id: CredentialRemoveError.id,
            message: `Cannot remove credential (credentialId=${credentialId}, projectId=${projectId}): ${reason}`,
            projectId,
            credentialId,
            reason,
        });
    }
}


export class CredentialInvalidError extends BadRequestException {
    static readonly id = ECommanderError.CredentialInvalid;

    static from(data: any): CredentialInvalidError {
        return new CredentialInvalidError(data.message);
    }

    constructor(message: any) {
        super({
            id: CredentialInvalidError.id,
            message,
        });
    }
}


export class CredentialQueryNotFoundError extends BadRequestException {
    static readonly id = ECommanderError.CredentialQueryNotFound;

    static from(data: any): CredentialQueryNotFoundError {
        return new CredentialQueryNotFoundError(data.command);
    }

    constructor(command: string) {
        super({
            id: CredentialQueryNotFoundError.id,
            message: `Credential query ${command} not found`,
            command,
        });
    }
}


//////////// CONNECTORS ////////////
export class ConnectorNotFoundError extends BadRequestException {
    static readonly id = ECommanderError.ConnectorNotFound;

    static from(data: any): ConnectorNotFoundError {
        return new ConnectorNotFoundError(
            data.projectId,
            data.connectorId
        );
    }

    constructor(
        projectId: string,
        connectorId: string
    ) {
        super({
            id: ConnectorNotFoundError.id,
            message: `Cannot find connector (connectorId=${connectorId}, projectId=${projectId})`,
            projectId,
            connectorId,
        });
    }
}


export class ConnectorNameAlreadyExistsError extends BadRequestException {
    static readonly id = ECommanderError.ConnectorNameAlreadyExists;

    static from(data: any): ConnectorNameAlreadyExistsError {
        return new ConnectorNameAlreadyExistsError(
            data.projectId,
            data.name
        );
    }

    constructor(
        projectId: string, name: string
    ) {
        super({
            id: ConnectorNameAlreadyExistsError.id,
            message: `Already found connector (name=${name}, projectId=${projectId})`,
            projectId,
            name,
        });
    }
}


export class ConnectorUpdateError extends BadRequestException {
    static readonly id = ECommanderError.ConnectorUpdate;

    static from(data: any): ConnectorUpdateError {
        return new ConnectorUpdateError(
            data.projectId,
            data.connectorId,
            data.reason
        );
    }

    constructor(
        projectId: string,
        connectorId: string,
        reason: string
    ) {
        super({
            id: ConnectorUpdateError.id,
            message: `Cannot update connector (connectorId=${connectorId}, projectId=${projectId}): ${reason}`,
            projectId,
            connectorId,
            reason,
        });
    }
}


export class ConnectorCertificateNotFoundError extends BadRequestException {
    static readonly id = ECommanderError.ConnectorCertificateNotFound;

    static from(data: any): ConnectorCertificateNotUsedError {
        return new ConnectorCertificateNotFoundError(
            data.projectId,
            data.connectorId
        );
    }

    constructor(
        projectId: string,
        connectorId: string
    ) {
        super({
            id: ConnectorCertificateNotFoundError.id,
            message: `Connector certificate not found (connectorId=${connectorId}, projectId=${projectId})`,
            projectId,
            connectorId,
        });
    }
}


export class ConnectorCertificateNotUsedError extends BadRequestException {
    static readonly id = ECommanderError.ConnectorCertificateNotUsed;

    static from(data: any): ConnectorCertificateNotUsedError {
        return new ConnectorCertificateNotUsedError(
            data.projectId,
            data.connectorId,
            data.type
        );
    }

    constructor(
        projectId: string,
        connectorId: string,
        type: string
    ) {
        super({
            id: ConnectorCertificateNotUsedError.id,
            message: `Cannot use a certificate with this type of connector (type=${type}, connectorId=${connectorId}, projectId=${projectId})`,
            projectId,
            connectorId,
        });
    }
}


export class ConnectorRemoveError extends BadRequestException {
    static readonly id = ECommanderError.ConnectorRemove;

    static from(data: any): ConnectorRemoveError {
        return new ConnectorRemoveError(
            data.projectId,
            data.connectorId,
            data.reason
        );
    }

    constructor(
        projectId: string,
        connectorId: string,
        reason: string
    ) {
        super({
            id: ConnectorRemoveError.id,
            message: `Cannot remove connector (connectorId=${connectorId}, projectId=${projectId}): ${reason}`,
            projectId,
            connectorId,
            reason,
        });
    }
}


export class ConnectorInvalidError extends BadRequestException {
    static readonly id = ECommanderError.ConnectorInvalid;

    static from(data: any): ConnectorInvalidError {
        return new ConnectorInvalidError(data.message);
    }

    constructor(message: string) {
        super({
            id: ConnectorInvalidError.id,
            message,
        });
    }
}


export class NoConnectorToRefreshError extends BadRequestException {
    static readonly id = ECommanderError.NoConnectorToRefresh;

    static from(): NoConnectorToRefreshError {
        return new NoConnectorToRefreshError();
    }

    constructor() {
        super({
            id: NoConnectorToRefreshError.id,
            message: 'No connector to refresh',
        });
    }
}


export class ConnectorFactoryNotFoundError extends BadRequestException {
    static readonly id = ECommanderError.ConnectorFactoryNotFound;

    static from(data: any): ConnectorFactoryNotFoundError {
        return new ConnectorFactoryNotFoundError(data.type);
    }

    constructor(type: string) {
        super({
            id: ConnectorFactoryNotFoundError.id,
            message: `Cannot find connector factory (type=${type})`,
            type,
        });
    }
}


export class TransportNotFoundError extends BadRequestException {
    static readonly id = ECommanderError.TransportNotFound;

    static from(data: any): TransportNotFoundError {
        return new TransportNotFoundError(data.type);
    }

    constructor(type: string) {
        super({
            id: TransportNotFoundError.id,
            message: `Cannot find transport (type=${type})`,
            type,
        });
    }
}


//////////// PROXIES ////////////
export class ProxyNotFoundError extends BadRequestException {
    static readonly id = ECommanderError.ProxyNotFound;

    static from(data: any): ProxyNotFoundError {
        return new ProxyNotFoundError(
            data.projectId,
            data.connectorId,
            data.proxyId
        );
    }

    constructor(
        projectId: string,
        connectorId: string,
        proxyId: string
    ) {
        super({
            id: ProxyNotFoundError.id,
            message: `Cannot find proxy (proxyId=${proxyId}, connectorId=${connectorId}, projectId=${projectId})`,
            projectId,
            connectorId,
            proxyId,
        });
    }
}


export class ProxiesNotFoundError extends BadRequestException {
    static readonly id = ECommanderError.ProxiesNotFound;

    static from(data: any): ProxiesNotFoundError {
        return new ProxiesNotFoundError(data.proxiesIds);
    }

    constructor(proxiesIds: string[]) {
        super({
            id: ProxiesNotFoundError.id,
            message: `Cannot find proxies (proxiesIds=${safeJoin(proxiesIds)})`,
            proxiesIds,
        });
    }
}


export class NoProjectProxyError extends BadRequestException {
    static readonly id = ECommanderError.NoProjectProxy;

    static from(data: any): NoProjectProxyError {
        return new NoProjectProxyError(data.projectId);
    }

    constructor(projectId: string) {
        super({
            id: NoProjectProxyError.id,
            message: `Cannot find any proxy (projectId=${projectId})`,
            projectId,
        });
    }
}


export class NoProxyToRefreshError extends BadRequestException {
    static readonly id = ECommanderError.NoProxyToRefresh;

    static from(): NoProxyToRefreshError {
        return new NoProxyToRefreshError();
    }

    constructor() {
        super({
            id: NoProxyToRefreshError.id,
            message: 'No proxy to refresh',
        });
    }
}


//////////// FREEPROXIES ////////////
export class FreeproxiesNotFoundError extends BadRequestException {
    static readonly id = ECommanderError.FreeproxiesNotFound;

    static from(data: any): FreeproxiesNotFoundError {
        return new FreeproxiesNotFoundError(data.proxiesIds);
    }

    constructor(proxiesIds: string[]) {
        super({
            id: FreeproxiesNotFoundError.id,
            message: `Cannot find freeproxies (proxiesIds=${safeJoin(proxiesIds)})`,
            proxiesIds,
        });
    }
}


export class NoFreeproxyToRefreshError extends BadRequestException {
    static readonly id = ECommanderError.NoFreeproxyToRefresh;

    static from(): NoFreeproxyToRefreshError {
        return new NoFreeproxyToRefreshError();
    }

    constructor() {
        super({
            id: NoFreeproxyToRefreshError.id,
            message: 'No freeproxy to refresh',
        });
    }
}


//////////// TASKS ////////////
export class TaskNotFoundError extends BadRequestException {
    static readonly id = ECommanderError.TaskNotFound;

    static from(data: any): TaskNotFoundError {
        return new TaskNotFoundError(
            data.projectId,
            data.taskId
        );
    }

    constructor(
        projectId: string,
        taskId: string
    ) {
        super({
            id: TaskNotFoundError.id,
            message: `Cannot find task (taskId=${taskId}, projectId=${projectId})`,
            projectId,
            taskId,
        });
    }
}


export class TaskCreateError extends BadRequestException {
    static readonly id = ECommanderError.TaskCreate;

    static from(data: any): TaskCreateError {
        return new TaskCreateError(
            data.projectId,
            data.connectorId,
            data.reason
        );
    }

    constructor(
        projectId: string,
        connectorId: string,
        reason: string
    ) {
        super({
            id: TaskCreateError.id,
            message: `Cannot create task for this connector (connectorId=${connectorId}, projectId=${projectId}): ${reason}`,
            projectId,
            connectorId,
            reason,
        });
    }
}


export class TaskCancelError extends BadRequestException {
    static readonly id = ECommanderError.TaskCancel;

    static from(data: any): TaskCancelError {
        return new TaskCancelError(
            data.projectId,
            data.connectorId,
            data.reason
        );
    }

    constructor(
        projectId: string,
        connectorId: string,
        reason: string
    ) {
        super({
            id: TaskCancelError.id,
            message: `Cannot cancel task for this connector (connectorId=${connectorId}, projectId=${projectId}): ${reason}`,
            projectId,
            connectorId,
            reason,
        });
    }
}


export class TaskRemoveError extends BadRequestException {
    static readonly id = ECommanderError.TaskRemove;

    static from(data: any): TaskRemoveError {
        return new TaskRemoveError(
            data.projectId,
            data.taskId,
            data.reason
        );
    }

    constructor(
        projectId: string,
        taskId: string,
        reason: string
    ) {
        super({
            id: TaskRemoveError.id,
            message: `Cannot remove task (taskId=${taskId}, projectId=${projectId}): ${reason}`,
            projectId,
            taskId,
            reason,
        });
    }
}


export class TaskStepError extends InternalServerErrorException {
    static readonly id = ECommanderError.TaskStep;

    static from(data: any): TaskStepError {
        return new TaskStepError(
            data.step,
            data.reason
        );
    }

    constructor(
        step: number,
        reason: string
    ) {
        super({
            id: TaskStepError.id,
            message: `Task error (step=${step}): ${reason}`,
            step,
            reason,
        });
    }
}


export class TaskFactoryNotFoundError extends BadRequestException {
    static readonly id = ECommanderError.TaskFactoryNotFound;

    static from(data: any): TaskFactoryNotFoundError {
        return new TaskFactoryNotFoundError(data.type);
    }

    constructor(type: string) {
        super({
            id: TaskFactoryNotFoundError.id,
            message: `Cannot find task factory (type=${type})`,
            type,
        });
    }
}


export class NoTaskToRefreshError extends BadRequestException {
    static readonly id = ECommanderError.NoTaskToRefresh;

    static from(): NoTaskToRefreshError {
        return new NoTaskToRefreshError();
    }

    constructor() {
        super({
            id: NoTaskToRefreshError.id,
            message: 'No task to refresh',
        });
    }
}


//////////// PARAMS ////////////
export class ParamNotFoundError extends BadRequestException {
    static readonly id = ECommanderError.ParamNotFound;

    static from(data: any): ParamNotFoundError {
        return new ParamNotFoundError(data.key);
    }

    constructor(key: string) {
        super({
            id: ParamNotFoundError.id,
            message: `Cannot find param (key=${key})`,
            key,
        });
    }
}


//////////// CERTIFICATES ////////////
export class CertificateNotFoundError extends BadRequestException {
    static readonly id = ECommanderError.CertificateNotFound;

    static from(data: any): CertificateNotFoundError {
        return new CertificateNotFoundError(data.hostname);
    }

    constructor(hostname: string) {
        super({
            id: CertificateNotFoundError.id,
            message: `Cannot find certificate (hostname=${hostname})`,
            hostname,
        });
    }
}


//////////// MISC ////////////
export class InconsistencyDataError extends InternalServerErrorException {
    static readonly id = ECommanderError.InconsistencyData;

    static from(data: any): InconsistencyDataError {
        return new InconsistencyDataError(data.message);
    }

    constructor(message: string) {
        super({
            id: InconsistencyDataError.id,
            message,
        });
    }
}
