# API Reference

Scrapoxy provides a REST API to manage your instances directly from the scraper.

Base URL is `http://localhost:8890` (depending on your configuration).


## Swagger

Scrapoxy exposes a Swagger UI on `http://localhost:8890/api`.

Additionally, it offers:
- a Swagger JSON file at `http://localhost:8890/api-json`
- a YAML file at `http://localhost:8890/api-yaml`


## Authentication

Scrapoxy employs HTTP Basic Authentication for request authentication.

The username/password comes from the project settings.

![Token](./token.png)

The token follows this format: `USERNAME:PASSWORD`.

Basic authentication transmits the username and password in the `Authorization` header of a request,
encoded using Base64.

For example, if the username/password is `admin:password`, the header will be `Authorization: Basic YWRtaW46cGFzc3dvcmQ=`. 


## Get project information

### Request 

URL: `/api/scraper/project`

Method: `GET`


### Response

Type: `application/json`

Valid status code: `200`

Response payload:

```json
{
    "id": "<uuid of the project>",
    "name": "<name of the project>",
    "status": "<status of the project from OFF, CALM or HOT>",
    "connectorDefault": "<default connector ID or undefined>"
}
```


## Change project's status

### Request

URL: `/api/scraper/project/status`

Method: `POST`

Request payload:

```json
{
    "status": "<status of the project from OFF, CALM or HOT>"
}
```


### Response

Valid status code: `204`

The response has no content.


## Get all connectors and proxies of the project

### Request

URL: `/api/scraper/project/connectors`

Method: `GET`


### Response

Type: `application/json`

Valid status code: `200`

Response payload:

```json
[
    {
        "connector": {
            "id": "<uuid of the connector>",
            "projectId": "<uuid of the project>",
            "name": "<name of the connector>",
            "type": "<type of provider>",
            "active": "<true if the connector is active>",
            "proxiesMax": "<maximum number of proxies to use>",
            "error": "<error message if the connector is in error>",
            "certificateEndAt": "<timestamp in ms of the end of the certificate for datacenter provider>"
        },
        "proxies": [
            {
                "id": "<uuid of the connector + ':' + key of the proxy>",
                "type": "<type of provider>",
                "connectorId": "<uuid of the connector>",
                "projectId": "<uuid of the project>",
                "key": "<unique key of the proxy in the connector>",
                "name": "<name of the proxy>",
                "status": "<status of the proxy from STARTING, STARTED, STOPPING, STOPPED or ERROR>",
                "removing": "<true if the proxy is being removed>",
                "removingForce": "<true if the proxy is being removed by force (see below)>",
                "fingerprint": {
                    "ip": "<IP address of the proxy>",
                    "useragent": "<user agent for the fingerprinted request>",
                    "asnName": "<name of the Autonomous System Number (ASN) of this IP address>",
                    "asnNetwork": "<network of this IP address>",
                    "continentCode": "<2-letter continent code of the IP Address>",
                    "continentName": "<continent name of the IP Address>",
                    "countryCode": "<2-letter country code of the IP Address>",
                    "countryName": "<country name of the IP Address>",
                    "cityName": "<city name of the IP Address>",
                    "timezone": "<timezone of the IP Address>",
                    "latitude": "<latitude of the IP Address>",
                    "longitude": "<longitude of the IP Address>"
                },
                "fingerprintError": "<error message if fingerprinting failed>",
                "createdTs": "<timestamp in ms of the proxy creation>",
                "requests": "<number of requests made by the proxy>",
                "bytesReceived": "<number of bytes received by the proxy>",
                "bytesSent": "<number of bytes sent by the proxy>",
            },
            ...
        ]
    },
    ...
]
```


## Ask to remove some proxies

### Request

URL: `/api/scraper/project/proxies/remove`

Method: `POST`

Request payload:

```json
[
    {
        "id": "<uuid of the connector + ':' + key of the proxy>",
        "force": "<true to force the removal>"
    },
    ...
]
```

The `force` parameter activates the special capability of the connector. 
It can either reboot a hardware dongle or remove proxy instances from a subscription.


### Response

Valid status code: `204`

The response has no content.


## Get all sources providing proxy lists sources for a connector

### Request

URL: `/api/scraper/project/connectors/<uuid of the connector>/sources`

Method: `GET`

Replace `<uuid of the connector>` by the UUID of the connector.


### Response

Type: `application/json`

Valid status code: `200`

Response payload:

```json
[
    {
        "id": "<uuid of the source>",
        "connectorId": "<uuid of the connector>",
        "projectId": "<uuid of the project>",
        "url": "<url of the source>",
        "delay": "<delay in ms between 2 fetches of the source>",
        "lastRefreshTs": "<timestamp in ms of the last refresh of the source>",
        "lastRefreshError": "<error message if the last refresh of the source is in error>"
    },
    ...
]
```


## Add multiple sources providing proxy lists for a connector

### Request

URL: `/api/scraper/project/connectors/<uuid of the connector>/sources`

Method: `POST`

Replace `<uuid of the connector>` by the UUID of the connector.

Request payload:

```json
[
    {
        "url": "<url of the source>",
        "delay": "<delay in ms between 2 fetches of the source>"
    },
    ...
]
```


### Response

Valid status code: `204`

The response has no content.


## Remove multiple sources providing proxy lists for a connector

### Request

URL: `/api/scraper/project/connectors/<uuid of the connector>/sources/remove`

Method: `POST`

Replace `<uuid of the connector>` by the UUID of the connector.

Request payload:

```json
[
    "<uuid of the source>",
    ...
]
```

::: info
If the payload is empty, all sources will be removed.
:::


### Response

Valid status code: `204`

The response has no content.


## Get all freeproxies of a connector

### Request

URL: `/api/scraper/project/connectors/<uuid of the connector>/freeproxies`

Method: `GET`

Replace `<uuid of the connector>` by the UUID of the connector.


### Response

Type: `application/json`

Valid status code: `200`

Response payload:

```json
[
    {
        "id": "<uuid of the connector + ':' + key of the freeproxy>",
        "connectorId": "<uuid of the connector>",
        "projectId": "<uuid of the project>",
        "key": "<key of the freeproxy in the connector>",
        "type": "<protocol type like http/https/socks4/socks5>",
        "address": {
            "hostname": "<hostname of the proxy>",
            "port": "<TCP port of the proxy>"
        },
        "auth": { // or undefined if no authentication
            "username": "<username of the proxy>",
            "password": "<password of the proxy>"
        },
        "fingerprint": "<fingerprint of the freeproxy if online>",
        "fingerprintError": "<error message if the fingerprint of the freeproxy is in error>",
        "timeoutDisconnected": "<maximum duration in ms for connecting to a freeproxy before considering it as offline>",
        "timeoutUnreachable": "if enabled, maximum duration in ms for a freeproxy to be offline before being removed from the pool, otherwise undefined",
        "disconnectedTs": "<timestamp of the last disconnection of the freeproxy or undefined if online>"
    },
    ...
]
```


## Add multiple freeproxies for a connector

### Request

URL: `/api/scraper/project/connectors/<uuid of the connector>/freeproxies`

Method: `POST`

Replace `<uuid of the connector>` by the UUID of the connector.

Request payload:

```json
[
    {
        "key": "<key of the freeproxy in the connector>",
        "type": "<protocol type like http/https/socks4/socks5>",
        "address": {
            "hostname": "<hostname of the freeproxy>",
            "port": "<port of the freeproxy>"
        },
        "auth": { // or undefined if no authentication
            "username": "<username of the freeproxy>",
            "password": "<password>"
        },
    },
    ...
]
```

::: info
Use `<hostname>:<port>` for the `key` field.
:::


### Response

Valid status code: `204`

The response has no content.


## Remove multiple freeproxies for a connector

### Request

URL: `/api/scraper/project/connectors/<uuid of the connector>/freeproxies/remove`

Method: `POST`

Replace `<uuid of the connector>` by the UUID of the connector.

Request payload:

```json
{
    "ids": [
        "<uuid of the freeproxy>",
        ...
    ],
    "duplicate": "<true to remove all duplicates of the freeproxies>",
    "offline": "<true to remove all offline freeproxies>"
}
```

::: info
All parameters are optionals and if the payload is empty, all freeproxies will be removed.
:::
