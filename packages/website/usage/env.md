# Environment variables

## Security

### Commander

- `BACKEND_JWT_SECRET` : Secret of the JWT used for internal connections.
- `BACKEND_JWT_EXPIRATION` : Duration of the JWT for internal connections. The default value is `60s`.


### User interface

- `FRONTEND_JWT_SECRET` : Secret of the JWT used for users connections.
- `FRONTEND_JWT_EXPIRATION` : Duration of the JWT for users connections. The default value is `24h`.
- `FRONTEND_SECURE_COOKIE` : Enable the secure flag on the authentication cookie by setting it to `1`, especially if the Scrapoxy UI is located behind an SSL reverse proxy like [Nginx](https://www.nginx.com). The default value is `0`.


:::warning
To start Scrapoxy, it is mandatory to set the secrets `BACKEND_JWT_SECRET` and `FRONTEND_JWT_SECRET`.
:::


## Network

### Commander

- `COMMANDER_PORT` : Port of the Commander API. The default value is `8890`.
- `COMMANDER_URL` : Commander exposed API URL. It is required if using a distributed configuration. The default value is `http://localhost:COMMANDER_PORT/api`.


### User interface

- `FRONTEND_URL` : Default URL of the frontend, used for authentication. The default value is `http://localhost:8890`.


### Master

- `MASTER_PORT` : Port of the Master. The default value is `8888`.
- `MASTER_TIMEOUT` : Timeout in milliseconds when the Master relays a request to a proxy endpoint. The default value is `60000` (1 minute).


### Probe

- `PROBE_PORT` : Port of the probe that checks if storage is alive. The default value is `8887`.


### Fingerprint

- `FINGERPRINT_URL` : URL of the fingerprint server to retrieve proxy information. The default value is `https://fingerprint.scrapoxy.io/api/json`.
- `FINGERPRINT_FOLLOW_REDIRECT_MAX` : Max number of HTTP redirects allowed when requesting the fingerprint server. The default value is `3`.
- `FINGERPRINT_RETRY_MAX` : Maximum retries before stating a proxy or freeproxy are inaccessible. The default value is `2`.
- `FINGERPRINT_TIMEOUT` : Timeout in milliseconds of request when requesting the fingerprint server. The default value is `5000` (5 seconds).


### Man-in-the-middle

- `MITM_CERTIFICATE_DURATION` : Duration in milliseconds of generated website TLS certificates. The default value is `31536000000` (1 year).


## Authentication

### Username/password

To activate basic authentication, set all the following environment variables:

- `AUTH_LOCAL_USERNAME` : Username
- `AUTH_LOCAL_PASSWORD` : Password


### Github

To activate Github OAuth authentication, set all the following environment variables:

- `AUTH_GITHUB_CLIENT_ID` : Github Client ID
- `AUTH_GITHUB_SECRET` : Github Secret
- `AUTH_GITHUB_CALLBACK_URL` : Callback URL. The default value is `FRONTEND_URL/api/users/auths/github`.


### Google

To activate Google OAuth authentication, set all the following environment variables:

- `AUTH_GOOGLE_CLIENT_ID` : Google Client ID
- `AUTH_GOOGLE_SECRET` : Google Secret
- `AUTH_GOOGLE_CALLBACK_URL` : Callback URL. The default value is `FRONTEND_URL/api/users/auths/google`.


## Storage

### File

If you are using file storage, configure the following environment variables:

- `STORAGE_FILE_FILENAME` : Filename of the local configuration file. The default value is `scrapoxy.json`.
- `STORAGE_FILE_CERTIFICATES_MAX` : Maximum number of TLS certificates cached in memory for file storage. The default value is `1000`.


### Distributed

If you are using distributed storage, configure the following environment variables:
 
_For MongoDB:_
 
- `STORAGE_DISTRIBUTED_MONGO_URI` : URI of MongoDB server. The default value is `mongodb://user:password@localhost`.
- `STORAGE_DISTRIBUTED_MONGO_DB` : Name of MongoDB database. The default value is `scrapoxy`.
- `STORAGE_DISTRIBUTED_MONGO_CERTIFICATES_SZ` : Maximum size in bytes of TLS certificates cached in MongoDB. The default value is `268435456` (256 MB).

_For RabbitMQ:_
 
- `STORAGE_DISTRIBUTED_RABBITMQ_URL` : URL of RabbitMQ server. The default value is `amqp://user:password@localhost:5672`.
- `STORAGE_DISTRIBUTED_RABBITMQ_QUEUE_ORDERS` : Queue of RabbitMQ to send CQRS orders. The default value is `scrapoxyorders`.
- `STORAGE_DISTRIBUTED_RABBITMQ_QUEUE_EVENTS` : Queue of RabbitMQ to receive CQRS events. The default value is `scrapoxyevents`.


## Refresh

### Connectors

- `CONNECTORS_REFRESH_EMPTY_DELAY` : Delay in milliseconds to wait if there is no connector to refresh. The default value is `1000` (1 second).
- `CONNECTORS_REFRESH_ERROR_DELAY` : Delay in milliseconds to wait if connector's refresh triggers an error. The default value is `2000` (2 seconds).


### Proxies


- `PROXY_REFRESH_COUNT` : Number of proxies to fingerprint at once. The default value is `200`.
- `PROXY_REFRESH_DELAY` : Delay in milliseconds between 2 fingerprint requests of a proxy, adjusted by subtracting the timeout duration. The default value is `1000` (1 seconds).
- `PROXIES_REFRESH_EMPTY_DELAY` : Delay in milliseconds to wait if there is no proxy to refresh. The default value is `1000` (1 second).
- `PROXIES_REFRESH_ERROR_DELAY` : Delay in milliseconds to wait if proxy's refresh triggers an error. The default value is `2000` (2 seconds).


### Freeproxies

- `FREEPROXY_REFRESH_COUNT` : Number of freeproxies to fingerprint at once. The default value is `100`.
- `FREEPROXY_REFRESH_DELAY` : Delay in milliseconds between 2 fingerprint requests of a freeproxy, adjusted by subtracting the timeout duration. The default value is `60000` (1 minute).
- `FREEPROXIES_REFRESH_EMPTY_DELAY` : Delay in milliseconds to wait if there is no freeproxy to refresh. The default value is `1000` (1 second).
- `FREEPROXIES_REFRESH_ERROR_DELAY` : Delay in milliseconds to wait if freeproxy's refresh triggers an error. The default value is `2000` (2 seconds).


### Metrics
 
- `MASTER_REFRESH_METRICS_DELAY` : Delay interval in milliseconds to send traffic metrics of the Master to the Commander API. The default value is `10000` (10 seconds).
- `METRICS_REFRESH_REFRESH_DELAY` : Delay interval in milliseconds to calculate metrics of all projects. The default value is `10000` (10 seconds).


### Tasks

- `TASKS_REFRESH_EMPTY_DELAY` : Delay in milliseconds to wait if there is no task to execute. The default value is `1000` (1 second).
- `TASKS_REFRESH_ERROR_DELAY` : Delay in milliseconds to wait if task's execution triggers an error. The default value is `2000` (2 seconds).


### Stopping Scrapoxy

- `CLEAR_AT_SHUTDOWN` : Clear all proxies at shutdown. Values are `1` for yes and `0` for no. This is useful when you run Scrapoxy locally. The default value is `0`.
- `STOPPING_DELAY` : Delay in milliseconds between queries count of active proxies during shutdown. It is only available if `CLEAR_AT_SHUTDOWN` is active. The default value is `2000` (2 seconds).
