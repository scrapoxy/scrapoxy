# API Reference

Scrapoxy provides a REST API to manage your instances directly from the scraper.

Base URL is `http://localhost:8890` (depending on your configuration).


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
            "certificateEndAt": "<date of the end of the certificate for cloud provider>"
        },
        "proxies": [
            {
                "id": "<uuid of the proxy>",
                "type": "<type of provider>",
                "connectorId": "<uuid of the connector>",
                "projectId": "<uuid of the project>",
                "key": "<key of the proxy in the connector>",
                "name": "<name of the proxy>",
                "status": "<status of the proxy from STARTING, STARTED, STOPPING, STOPPED or ERROR>",
                "removing": "<true if the proxy is being removed>",
                "removingForce": "<true if the proxy is being removed by force (see below)>",
                "createdTs": "<date of creation of the proxy>"
            },
            ...
        ]
    },
    ...
]
```


## Ask to remove somes proxies

### Request

URL: `/api/scraper/project/proxies/remove`

Method: `POST`

Request payload:

```json
[
    {
        "id": "<uuid of the proxy>",
        "force": "<true to force the removal>"
    },
    ...
]
```

The `force` parameter activates the special capability of the connector. 
It can either reboot a hardware dongle or remove proxy instances from a subscription.


### Response

Type: `application/json`

Valid status code: `204`

The response has no content.
