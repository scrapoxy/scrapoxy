# Errors

Scrapoxy can show different errors, each with:

* an HTTP status code
* an ID
* a description

Here are the errors you might see:


## 407 HTTP Status

All these errors are related to authentication with Scrapoxy.


### ID: 'no_token'

This error occurs when there is no authentication token in the header request.
To fix this, add the `Proxy-Authorization` header with the token formatted as `Basic BASE64(USERNAME:PASSWORD)`.

Use the username and password found in the `Project Settings` tab:


![Project settings](no_token.png)


### ID: 'no_project'

This error occurs if the token exists but does not match any project (invalid token).

Please verify the username and password in the `Project Settings` tab:

![Project settings](no_token.png)


## 557 HTTP Status

All these errors are related to the Scrapoxy behavior.


### ID: 'no_proxy'

Authentication is successful, but no proxies are currently online:

![No proxy online](no_proxy_empty.png)

Please ensure you have at least one proxy online (green status) in the `Proxies` tab:

![Only one proxy online](no_proxy_one.png)


### ID: 'wrong_url'

The URL sent to Scrapoxy is incorrect.
This error occurs when Scrapoxy is requested to collect:

* An empty URL.
* A URL without a hostname.


### ID: 'cannot_scaleup'

This error occurs when attempting to scale the project.
It is usually due to a connectivity issue between the **commander**, **master**, or **database**.

::: info
This only happens when `Auto Scale UP` is enabled and the project's status is **CALM**.
:::


### ID: 'build_request' / 'build_connect'

This occurs when the **master** tries to create a request and:

* The connectors do not exist.
* The request parameters are incompatible with the connector. 

::: info
`build_request` is for HTTP requests, and `build_connect` is for CONNECT requests.
:::


### ID: 'socket_error'

This occurs during a CONNECT request when there is a problem with the relaying socket.


### ID: 'write_error'

This occurs during a CONNECT request when sending HTTP headers on a closed socket.


### ID: 'request_error'


This occurs when the scraper triggers an error on the outbound stream.

It can be due to many issues such as:

* a connection hangout,
* flow problem,
* incorrect values,
* or continuing to send packets on a closed connection.


### ID: 'response_error'

This can originate from 2 network elements in the inbound stream: **the target website** or **the connector** (cloud provider or proxy service). 

It can be due to many issues such as:

* a connection hangout,
* flow problem,
* incorrect values,
* or continuing to send packets on a closed connection.
