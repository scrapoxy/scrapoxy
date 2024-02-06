export enum ECommanderError {
    //////////// USERS ////////////
    AuthNotFound = 'auth_not_found',
    JwtInvalid = 'jwt_invalid',
    UserNotFound = 'user_not_found',
    UserNotFoundByEmail = 'user_not_found_by_email',
    UserEmailAlreadyExists = 'user_email_already_exists',
    UserProfileIncomplete = 'user_profile_incomplete',

    //////////// PROJECTS ////////////
    ProjectNotFound = 'project_not_found',
    ProjectNameAlreadyExists = 'project_name_already_exists',
    ProjectTokenNotFound = 'project_token_not_found',
    ProjectInaccessible = 'project_inaccessible',
    ProjectRemove = 'project_remove',
    ProjectUserAccess = 'project_user_access',

    //////////// CREDENTIALS ////////////
    CredentialNotFound = 'credential_not_found',
    CredentialNameAlreadyExists = 'credential_name_already_exists',
    CredentialUpdate = 'credential_update',
    CredentialRemove = 'credential_remove',
    CredentialInvalid = 'credential_invalid',
    CredentialQueryNotFound = 'credential_query_not_found',

    //////////// CONNECTORS ////////////
    ConnectorNotFound = 'connector_not_found',
    ConnectorNameAlreadyExists = 'connector_name_already_exists',
    ConnectorUpdate = 'connector_update',
    ConnectorCertificateNotFound = 'connector_certificate_not_found',
    ConnectorCertificateNotUsed = 'connector_certificate_not_used',
    ConnectorRemove = 'connector_remove',
    ConnectorInvalid = 'connector_invalid',
    ConnectorWrongType = 'connector_wrong_type',
    NoConnectorToRefresh = 'no_connector_to_refresh',
    ConnectorFactoryNotFound = 'connector_factory_not_found',
    TransportNotFound = 'transport_not_found',

    //////////// PROXIES ////////////
    ProxyNotFound = 'proxy_not_found',
    ProxiesNotFound = 'proxies_not_found',
    NoProjectProxy = 'no_project_proxy',
    NoProxyToRefresh = 'no_proxy_to_refresh',

    //////////// FREEPROXIES ////////////
    FreeproxiesNotFound = 'freeproxies_not_found',
    SourceNotFound = 'source_not_found',
    NoFreeproxyToRefresh = 'no_freeproxy_to_refresh',
    NoSourceToRefresh = 'no_source_to_refresh',

    //////////// TASKS ////////////
    TaskNotFound = 'task_not_found',
    TaskCreate = 'task_create',
    TaskCancel = 'task_cancel',
    TaskRemove = 'task_remove',
    TaskStep = 'task_step',
    TaskFactoryNotFound = 'task_factory_not_found',
    NoTaskToRefresh = 'no_task_to_refresh',

    //////////// PARAMS ////////////
    ParamNotFound = 'param_not_found',

    //////////// CERTIFICATES ////////////
    CertificateNotFound = 'certificate_not_found',

    //////////// MISC ////////////
    InconsistencyData = 'inconsistency_data',
    Validation = 'validation',
}
