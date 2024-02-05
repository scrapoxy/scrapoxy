import {
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import {
    ECommanderError,
    safeJoin,
} from '@scrapoxy/common';


//////////// BASE ////////////
export class HttpBaseException extends HttpException {
    constructor(
        status: HttpStatus,
        id: ECommanderError,
        message: string,
        public loggable: boolean,
        payload?: { [key: string]: any }
    ) {
        super(
            {
                id,
                message,
                ...payload ?? {},
            },
            status
        );
    }
}

//////////// USERS ////////////
export class AuthNotFoundError extends HttpBaseException {
    static readonly id = ECommanderError.AuthNotFound;

    static from(data: any): AuthNotFoundError {
        return new AuthNotFoundError(data.type);
    }

    constructor(type?: string) {
        super(
            HttpStatus.UNAUTHORIZED,
            AuthNotFoundError.id,
            `Cannot find auth (type=${type})`,
            true
        );
    }
}


export class JwtInvalidError extends HttpBaseException {
    static readonly id = ECommanderError.JwtInvalid;

    static from(data: any): JwtInvalidError {
        return new JwtInvalidError(data.reason);
    }

    constructor(reason: string) {
        super(
            HttpStatus.UNAUTHORIZED,
            JwtInvalidError.id,
            `JWT is invalid: ${reason}`,
            true,
            {
                reason,
            }
        );
    }
}


export class UserNotFoundError extends HttpBaseException {
    static readonly id = ECommanderError.UserNotFound;

    static from(data: any): UserNotFoundError {
        return new UserNotFoundError(data.userId);
    }

    constructor(userId: string) {
        super(
            HttpStatus.BAD_REQUEST,
            UserNotFoundError.id,
            `Cannot find user (userId=${userId})`,
            true,
            {
                userId,
            }
        );
    }
}


export class UserNotFoundByEmailError extends HttpBaseException {
    static readonly id = ECommanderError.UserNotFoundByEmail;

    static from(data: any): UserNotFoundByEmailError {
        return new UserNotFoundByEmailError(data.email);
    }

    constructor(email: string) {
        super(
            HttpStatus.BAD_REQUEST,
            UserNotFoundByEmailError.id,
            `Cannot find user (email=${email})`,
            true,
            {
                email,
            }
        );
    }
}


export class UserEmailAlreadyExistsError extends HttpBaseException {
    static readonly id = ECommanderError.UserEmailAlreadyExists;

    static from(data: any): UserEmailAlreadyExistsError {
        return new UserEmailAlreadyExistsError(data.email);
    }

    constructor(email: string) {
        super(
            HttpStatus.BAD_REQUEST,
            UserEmailAlreadyExistsError.id,
            `Already found user (email=${email})`,
            true,
            {
                email,
            }

        );
    }
}


export class UserProfileIncompleteError extends HttpBaseException {
    static readonly id = ECommanderError.UserProfileIncomplete;

    static from(data: any): UserProfileIncompleteError {
        return new UserProfileIncompleteError(data.userId);
    }

    constructor(userId: string) {
        super(
            HttpStatus.FORBIDDEN,
            UserProfileIncompleteError.id,
            `User has incomplete profile (userId=${userId})`,
            true,
            {
                userId,
            }
        );
    }
}


//////////// PROJECTS ////////////
export class ProjectNotFoundError extends HttpBaseException {
    static readonly id = ECommanderError.ProjectNotFound;

    static from(data: any): ProjectNotFoundError {
        return new ProjectNotFoundError(data.projectId);
    }

    constructor(projectId: string) {
        super(
            HttpStatus.BAD_REQUEST,
            ProjectNotFoundError.id,
            `Cannot find project (projectId=${projectId})`,
            true,
            {
                projectId,
            }
        );
    }
}


export class ProjectNameAlreadyExistsError extends HttpBaseException {
    static readonly id = ECommanderError.ProjectNameAlreadyExists;

    static from(data: any): ProjectNameAlreadyExistsError {
        return new ProjectNameAlreadyExistsError(data.name);
    }

    constructor(name: string) {
        super(
            HttpStatus.BAD_REQUEST,
            ProjectNameAlreadyExistsError.id,
            `Already found project (name=${name})`,
            true,
            {
                name,
            }
        );
    }
}


export class ProjectTokenNotFoundError extends HttpBaseException {
    static readonly id = ECommanderError.ProjectTokenNotFound;

    static from(data: any): ProjectTokenNotFoundError {
        return new ProjectTokenNotFoundError(data.token);
    }

    constructor(token: string | undefined) {
        super(
            HttpStatus.UNAUTHORIZED,
            ProjectTokenNotFoundError.id,
            token ? `Cannot find project (token=${token})` : 'Cannot find project (no token)',
            true,
            {
                token,
            }
        );
    }
}


export class ProjectInaccessibleError extends HttpBaseException {
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
        super(
            HttpStatus.FORBIDDEN,
            ProjectInaccessibleError.id,
            `User cannot access to project (userId=${userId}, projectId=${projectId})`,
            true,
            {
                projectId,
                userId,
            }
        );
    }
}


export class ProjectRemoveError extends HttpBaseException {
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
        super(
            HttpStatus.BAD_REQUEST,
            ProjectRemoveError.id,
            `Cannot remove project (projectId=${projectId}): ${reason}`,
            true,
            {
                projectId,
                reason,
            }
        );
    }
}


export class ProjectUserAccessError extends HttpBaseException {
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
        super(
            HttpStatus.BAD_REQUEST,
            ProjectUserAccessError.id,
            reason,
            true,
            {
                projectId,
                reason,
            }
        );
    }
}


//////////// CREDENTIALS ////////////
export class CredentialNotFoundError extends HttpBaseException {
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
        super(
            HttpStatus.BAD_REQUEST,
            CredentialNotFoundError.id,
            `Cannot find credential (credentialId=${credentialId}, projectId=${projectId})`,
            true,
            {
                projectId,
                credentialId,
            }
        );
    }
}


export class CredentialNameAlreadyExistsError extends HttpBaseException {
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
        super(
            HttpStatus.BAD_REQUEST,
            CredentialNameAlreadyExistsError.id,
            `Already found credential (name=${name}, projectId=${projectId})`,
            true,
            {
                projectId,
                name,
            }
        );
    }
}


export class CredentialUpdateError extends HttpBaseException {
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
        super(
            HttpStatus.BAD_REQUEST,
            CredentialUpdateError.id,
            `Cannot update credential (credentialId=${credentialId}, projectId=${projectId}): ${reason}`,
            true,
            {
                credentialId,
                reason,
            }
        );
    }
}


export class CredentialRemoveError extends HttpBaseException {
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
        super(
            HttpStatus.BAD_REQUEST,
            CredentialRemoveError.id,
            `Cannot remove credential (credentialId=${credentialId}, projectId=${projectId}): ${reason}`,
            true,
            {
                projectId,
                credentialId,
                reason,
            }
        );
    }
}


export class CredentialInvalidError extends HttpBaseException {
    static readonly id = ECommanderError.CredentialInvalid;

    static from(data: any): CredentialInvalidError {
        return new CredentialInvalidError(data.message);
    }

    constructor(message: any) {
        super(
            HttpStatus.BAD_REQUEST,
            CredentialInvalidError.id,
            message,
            true
        );
    }
}


export class CredentialQueryNotFoundError extends HttpBaseException {
    static readonly id = ECommanderError.CredentialQueryNotFound;

    static from(data: any): CredentialQueryNotFoundError {
        return new CredentialQueryNotFoundError(data.command);
    }

    constructor(command: string) {
        super(
            HttpStatus.BAD_REQUEST,
            CredentialQueryNotFoundError.id,
            `Credential query ${command} not found`,
            true,
            {
                command,
            }
        );
    }
}


//////////// CONNECTORS ////////////
export class ConnectorNotFoundError extends HttpBaseException {
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
        super(
            HttpStatus.BAD_REQUEST,
            ConnectorNotFoundError.id,
            `Cannot find connector (connectorId=${connectorId}, projectId=${projectId})`,
            true,
            {
                projectId,
                connectorId,
            }
        );
    }
}


export class ConnectorNameAlreadyExistsError extends HttpBaseException {
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
        super(
            HttpStatus.BAD_REQUEST,
            ConnectorNameAlreadyExistsError.id,
            `Already found connector (name=${name}, projectId=${projectId})`,
            true,
            {
                projectId,
                name,
            }
        );
    }
}


export class ConnectorUpdateError extends HttpBaseException {
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
        super(
            HttpStatus.BAD_REQUEST,
            ConnectorUpdateError.id,
            `Cannot update connector (connectorId=${connectorId}, projectId=${projectId}): ${reason}`,
            true,
            {
                projectId,
                connectorId,
                reason,
            }
        );
    }
}


export class ConnectorCertificateNotFoundError extends HttpBaseException {
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
        super(
            HttpStatus.BAD_REQUEST,
            ConnectorCertificateNotFoundError.id,
            `Connector certificate not found (connectorId=${connectorId}, projectId=${projectId})`,
            true,
            {
                projectId,
                connectorId,
            }
        );
    }
}


export class ConnectorCertificateNotUsedError extends HttpBaseException {
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
        super(
            HttpStatus.BAD_REQUEST,
            ConnectorCertificateNotUsedError.id,
            `Cannot use a certificate with this type of connector (type=${type}, connectorId=${connectorId}, projectId=${projectId})`,
            true,
            {
                projectId,
                connectorId,
            }
        );
    }
}


export class ConnectorRemoveError extends HttpBaseException {
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
        super(
            HttpStatus.BAD_REQUEST,
            ConnectorRemoveError.id,
            `Cannot remove connector (connectorId=${connectorId}, projectId=${projectId}): ${reason}`,
            true,
            {
                projectId,
                connectorId,
                reason,
            }
        );
    }
}


export class ConnectorInvalidError extends HttpBaseException {
    static readonly id = ECommanderError.ConnectorInvalid;

    static from(data: any): ConnectorInvalidError {
        return new ConnectorInvalidError(data.message);
    }

    constructor(message: string) {
        super(
            HttpStatus.BAD_REQUEST,
            ConnectorInvalidError.id,
            message,
            true
        );
    }
}


export class ConnectorWrongTypeError extends HttpBaseException {
    static readonly id = ECommanderError.ConnectorWrongType;

    static from(data: any): ConnectorWrongTypeError {
        return new ConnectorWrongTypeError(
            data.typeCorrect,
            data.typeWrong
        );
    }

    constructor(
        typeCorrect: string,
        typeWrong: string
    ) {
        super(
            HttpStatus.BAD_REQUEST,
            ConnectorInvalidError.id,
            `Connector type should be ${typeCorrect} instead of ${typeWrong}`,
            true
        );
    }
}


export class NoConnectorToRefreshError extends HttpBaseException {
    static readonly id = ECommanderError.NoConnectorToRefresh;

    static from(): NoConnectorToRefreshError {
        return new NoConnectorToRefreshError();
    }

    constructor() {
        super(
            HttpStatus.BAD_REQUEST,
            NoConnectorToRefreshError.id,
            'No connector to refresh',
            false
        );
    }
}


export class ConnectorFactoryNotFoundError extends HttpBaseException {
    static readonly id = ECommanderError.ConnectorFactoryNotFound;

    static from(data: any): ConnectorFactoryNotFoundError {
        return new ConnectorFactoryNotFoundError(data.type);
    }

    constructor(type: string) {
        super(
            HttpStatus.BAD_REQUEST,
            ConnectorFactoryNotFoundError.id,
            `Cannot find connector factory (type=${type})`,
            true,
            {
                type,
            }
        );
    }
}


export class TransportNotFoundError extends HttpBaseException {
    static readonly id = ECommanderError.TransportNotFound;

    static from(data: any): TransportNotFoundError {
        return new TransportNotFoundError(data.type);
    }

    constructor(type: string) {
        super(
            HttpStatus.BAD_REQUEST,
            TransportNotFoundError.id,
            `Cannot find transport (type=${type})`,
            true,
            {
                type,
            }
        );
    }
}


//////////// PROXIES ////////////
export class ProxyNotFoundError extends HttpBaseException {
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
        super(
            HttpStatus.BAD_REQUEST,
            ProxyNotFoundError.id,
            `Cannot find proxy (proxyId=${proxyId}, connectorId=${connectorId}, projectId=${projectId})`,
            true,
            {
                projectId,
                connectorId,
                proxyId,
            }
        );
    }
}


export class ProxiesNotFoundError extends HttpBaseException {
    static readonly id = ECommanderError.ProxiesNotFound;

    static from(data: any): ProxiesNotFoundError {
        return new ProxiesNotFoundError(data.proxiesIds);
    }

    constructor(proxiesIds: string[]) {
        super(
            HttpStatus.BAD_REQUEST,
            ProxiesNotFoundError.id,
            `Cannot find proxies (proxiesIds=${safeJoin(proxiesIds)})`,
            true,
            {
                proxiesIds,
            }
        );
    }
}


export class NoProjectProxyError extends HttpBaseException {
    static readonly id = ECommanderError.NoProjectProxy;

    static from(data: any): NoProjectProxyError {
        return new NoProjectProxyError(data.projectId);
    }

    constructor(projectId: string) {
        super(
            HttpStatus.BAD_REQUEST,
            NoProjectProxyError.id,
            `Cannot find any proxy (projectId=${projectId})`,
            true,
            {
                projectId,
            }
        );
    }
}


export class NoProxyToRefreshError extends HttpBaseException {
    static readonly id = ECommanderError.NoProxyToRefresh;

    static from(): NoProxyToRefreshError {
        return new NoProxyToRefreshError();
    }

    constructor() {
        super(
            HttpStatus.BAD_REQUEST,
            NoProxyToRefreshError.id,
            'No proxy to refresh',
            false
        );
    }
}


//////////// FREEPROXIES ////////////
export class FreeproxiesNotFoundError extends HttpBaseException {
    static readonly id = ECommanderError.FreeproxiesNotFound;

    static from(data: any): FreeproxiesNotFoundError {
        return new FreeproxiesNotFoundError(data.proxiesIds);
    }

    constructor(proxiesIds: string[]) {
        super(
            HttpStatus.BAD_REQUEST,
            FreeproxiesNotFoundError.id,
            `Cannot find freeproxies (proxiesIds=${safeJoin(proxiesIds)})`,
            true,
            {
                proxiesIds,
            }
        );
    }
}


export class NoFreeproxyToRefreshError extends HttpBaseException {
    static readonly id = ECommanderError.NoFreeproxyToRefresh;

    static from(): NoFreeproxyToRefreshError {
        return new NoFreeproxyToRefreshError();
    }

    constructor() {
        super(
            HttpStatus.BAD_REQUEST,
            NoFreeproxyToRefreshError.id,
            'No freeproxy to refresh',
            false
        );
    }
}


//////////// TASKS ////////////
export class TaskNotFoundError extends HttpBaseException {
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
        super(
            HttpStatus.BAD_REQUEST,
            TaskNotFoundError.id,
            `Cannot find task (taskId=${taskId}, projectId=${projectId})`,
            true,
            {
                projectId,
                taskId,
            }
        );
    }
}


export class TaskCreateError extends HttpBaseException {
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
        super(
            HttpStatus.BAD_REQUEST,
            TaskCreateError.id,
            `Cannot create task for this connector (connectorId=${connectorId}, projectId=${projectId}): ${reason}`,
            true,
            {
                projectId,
                connectorId,
                reason,
            }
        );
    }
}


export class TaskCancelError extends HttpBaseException {
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
        super(
            HttpStatus.BAD_REQUEST,
            TaskCancelError.id,
            `Cannot cancel task for this connector (connectorId=${connectorId}, projectId=${projectId}): ${reason}`,
            true,
            {
                projectId,
                connectorId,
                reason,
            }
        );
    }
}


export class TaskRemoveError extends HttpBaseException {
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
        super(
            HttpStatus.BAD_REQUEST,
            TaskRemoveError.id,
            `Cannot remove task (taskId=${taskId}, projectId=${projectId}): ${reason}`,
            true,
            {
                projectId,
                taskId,
                reason,
            }
        );
    }
}


export class TaskStepError extends HttpBaseException {
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
        super(
            HttpStatus.INTERNAL_SERVER_ERROR,
            TaskStepError.id,
            `Task error (step=${step}): ${reason}`,
            true,
            {
                step,
                reason,
            }
        );
    }
}


export class TaskFactoryNotFoundError extends HttpBaseException {
    static readonly id = ECommanderError.TaskFactoryNotFound;

    static from(data: any): TaskFactoryNotFoundError {
        return new TaskFactoryNotFoundError(data.type);
    }

    constructor(type: string) {
        super(
            HttpStatus.BAD_REQUEST,
            TaskFactoryNotFoundError.id,
            `Cannot find task factory (type=${type})`,
            true,
            {
                type,
            }
        );
    }
}


export class NoTaskToRefreshError extends HttpBaseException {
    static readonly id = ECommanderError.NoTaskToRefresh;

    static from(): NoTaskToRefreshError {
        return new NoTaskToRefreshError();
    }

    constructor() {
        super(
            HttpStatus.BAD_REQUEST,
            NoTaskToRefreshError.id,
            'No task to refresh',
            false
        );
    }
}


//////////// PARAMS ////////////
export class ParamNotFoundError extends HttpBaseException {
    static readonly id = ECommanderError.ParamNotFound;

    static from(data: any): ParamNotFoundError {
        return new ParamNotFoundError(data.key);
    }

    constructor(key: string) {
        super(
            HttpStatus.BAD_REQUEST,
            ParamNotFoundError.id,
            `Cannot find param (key=${key})`,
            true,
            {
                key,
            }
        );
    }
}


//////////// CERTIFICATES ////////////
export class CertificateNotFoundError extends HttpBaseException {
    static readonly id = ECommanderError.CertificateNotFound;

    static from(data: any): CertificateNotFoundError {
        return new CertificateNotFoundError(data.hostname);
    }

    constructor(hostname: string) {
        super(
            HttpStatus.BAD_REQUEST,
            CertificateNotFoundError.id,
            `Cannot find certificate (hostname=${hostname})`,
            true,
            {
                hostname,
            }
        );
    }
}


//////////// MISC ////////////
export class InconsistencyDataError extends HttpBaseException {
    static readonly id = ECommanderError.InconsistencyData;

    static from(data: any): InconsistencyDataError {
        return new InconsistencyDataError(data.message);
    }

    constructor(message: string) {
        super(
            HttpStatus.INTERNAL_SERVER_ERROR,
            InconsistencyDataError.id,
            message,
            true
        );
    }
}
