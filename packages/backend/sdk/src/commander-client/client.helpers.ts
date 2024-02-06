import {
    AuthNotFoundError,
    CertificateNotFoundError,
    ConnectorCertificateNotFoundError,
    ConnectorCertificateNotUsedError,
    ConnectorFactoryNotFoundError,
    ConnectorInvalidError,
    ConnectorNameAlreadyExistsError,
    ConnectorNotFoundError,
    ConnectorRemoveError,
    ConnectorUpdateError,
    ConnectorWrongTypeError,
    CredentialInvalidError,
    CredentialNameAlreadyExistsError,
    CredentialNotFoundError,
    CredentialQueryNotFoundError,
    CredentialRemoveError,
    CredentialUpdateError,
    FreeproxiesNotFoundError,
    InconsistencyDataError,
    JwtInvalidError,
    NoConnectorToRefreshError,
    NoFreeproxyToRefreshError,
    NoProjectProxyError,
    NoProxyToRefreshError,
    NoSourceToRefreshError,
    NoTaskToRefreshError,
    ParamNotFoundError,
    ProjectInaccessibleError,
    ProjectNameAlreadyExistsError,
    ProjectNotFoundError,
    ProjectRemoveError,
    ProjectTokenNotFoundError,
    ProjectUserAccessError,
    ProxiesNotFoundError,
    ProxyNotFoundError,
    SourceNotFoundError,
    TaskCancelError,
    TaskCreateError,
    TaskFactoryNotFoundError,
    TaskNotFoundError,
    TaskRemoveError,
    TaskStepError,
    UserEmailAlreadyExistsError,
    UserNotFoundByEmailError,
    UserNotFoundError,
    UserProfileIncompleteError,
} from '../errors';
import { ValidationError } from '../helpers';


export function catchError(data: any) {
    if (data?.id) {
        switch (data.id) {
            //////////// USERS ////////////
            case AuthNotFoundError.id: {
                throw AuthNotFoundError.from(data);
            }

            case JwtInvalidError.id: {
                throw JwtInvalidError.from(data);
            }

            case UserNotFoundError.id: {
                throw UserNotFoundError.from(data);
            }

            case UserNotFoundByEmailError.id: {
                throw UserNotFoundByEmailError.from(data);
            }

            case UserEmailAlreadyExistsError.id: {
                throw UserEmailAlreadyExistsError.from(data);
            }

            case UserProfileIncompleteError.id: {
                throw UserProfileIncompleteError.from(data);
            }

            //////////// PROJECTS ////////////
            case ProjectNotFoundError.id: {
                throw ProjectNotFoundError.from(data);
            }

            case ProjectNameAlreadyExistsError.id: {
                throw ProjectNameAlreadyExistsError.from(data);
            }

            case ProjectTokenNotFoundError.id: {
                throw ProjectTokenNotFoundError.from(data);
            }

            case ProjectInaccessibleError.id: {
                throw ProjectInaccessibleError.from(data);
            }

            case ProjectRemoveError.id: {
                throw ProjectRemoveError.from(data);
            }

            case ProjectUserAccessError.id: {
                throw ProjectUserAccessError.from(data);
            }

            //////////// CREDENTIALS ////////////
            case CredentialNotFoundError.id: {
                throw CredentialNotFoundError.from(data);
            }

            case CredentialNameAlreadyExistsError.id: {
                throw CredentialNameAlreadyExistsError.from(data);
            }

            case CredentialUpdateError.id: {
                throw CredentialUpdateError.from(data);
            }

            case CredentialRemoveError.id: {
                throw CredentialRemoveError.from(data);
            }

            case CredentialInvalidError.id: {
                throw CredentialInvalidError.from(data);
            }

            case CredentialQueryNotFoundError.id: {
                throw CredentialQueryNotFoundError.from(data);
            }

            //////////// CONNECTORS ////////////
            case ConnectorNotFoundError.id: {
                throw ConnectorNotFoundError.from(data);
            }

            case ConnectorNameAlreadyExistsError.id: {
                throw ConnectorNameAlreadyExistsError.from(data);
            }

            case ConnectorUpdateError.id: {
                throw ConnectorUpdateError.from(data);
            }

            case ConnectorCertificateNotFoundError.id: {
                throw ConnectorCertificateNotFoundError.from(data);
            }

            case ConnectorCertificateNotUsedError.id: {
                throw ConnectorCertificateNotUsedError.from(data);
            }

            case ConnectorRemoveError.id: {
                throw ConnectorRemoveError.from(data);
            }

            case ConnectorInvalidError.id: {
                throw ConnectorInvalidError.from(data);
            }

            case ConnectorWrongTypeError.id: {
                throw ConnectorWrongTypeError.from(data);
            }

            case NoConnectorToRefreshError.id: {
                throw NoConnectorToRefreshError.from();
            }

            case ConnectorFactoryNotFoundError.id: {
                throw ConnectorFactoryNotFoundError.from(data);
            }

            //////////// PROXIES ////////////
            case ProxyNotFoundError.id: {
                throw ProxyNotFoundError.from(data);
            }

            case ProxiesNotFoundError.id: {
                throw ProxiesNotFoundError.from(data);
            }

            case NoProjectProxyError.id: {
                throw NoProjectProxyError.from(data);
            }

            case NoProxyToRefreshError.id: {
                throw NoProxyToRefreshError.from();
            }

            //////////// FREEPROXIES ////////////
            case FreeproxiesNotFoundError.id: {
                throw FreeproxiesNotFoundError.from(data);
            }

            case SourceNotFoundError.id: {
                throw SourceNotFoundError.from(data);
            }

            case NoFreeproxyToRefreshError.id: {
                throw NoFreeproxyToRefreshError.from();
            }

            case NoSourceToRefreshError.id: {
                throw NoSourceToRefreshError.from();
            }

            //////////// TASKS ////////////
            case TaskNotFoundError.id: {
                throw TaskNotFoundError.from(data);
            }

            case TaskCreateError.id: {
                throw TaskCreateError.from(data);
            }

            case TaskCancelError.id: {
                throw TaskCancelError.from(data);
            }

            case TaskRemoveError.id: {
                throw TaskRemoveError.from(data);
            }

            case TaskStepError.id: {
                throw TaskStepError.from(data);
            }

            case TaskFactoryNotFoundError.id: {
                throw TaskFactoryNotFoundError.from(data);
            }

            case NoTaskToRefreshError.id: {
                throw NoTaskToRefreshError.from();
            }

            //////////// PARAMS ////////////
            case ParamNotFoundError.id: {
                throw ParamNotFoundError.from(data);
            }

            //////////// CERTIFICATES ////////////
            case CertificateNotFoundError.id: {
                throw CertificateNotFoundError.from(data);
            }

            //////////// MISC ////////////
            case InconsistencyDataError.id: {
                throw InconsistencyDataError.from(data);
            }

            case ValidationError.id: {
                throw ValidationError.from(data);
            }
        }
    }
}
