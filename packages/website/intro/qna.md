# Questions & Answers

## I've got an error `no such file or directory, open 'scrapoxy.json'` at startup

This is a standard warning that occurs during the initial launchof Scrapoxy
when the configuration file has not been created yet.

Subsequently, you may encounter the following error:

```shell
Cannot read store: ENOENT: no such file or directory, open 'scrapoxy.json' 
```


## At login, I've got the error `JwtInvalidError: JWT is invalid: JWT missing`

This error can occur for the following reasons:

1. Incorrect login/password;
2. When returning to the UI with outdated cookies, requiring a re-login;
3. If Scrapoxy is hosted on HTTP but the `FRONTEND_SECURE_COOKIE` environment variable is set to 1.


## Instances are never up

There can be multiple reasons for this error:

![Instances never up](instances_never_up.png)

### Cause 1: Adding an existing connector to an installation

When adding a connector from a prior setup, be aware that the certificate, won't be transferred.
This discrepancy arises because Scrapoxy embeds a unique TLS certificate within the instance image to secure communication with the Master.
As a result, the certificate may not match between the existing instance and the newly integrated Scrapoxy connector.
To address this issue, it's recommended to uninstall and then reinstall the connector for proper synchronization.

### Cause 2: Deploying a single image across multiple zones or regions

It's important to note that most cloud providers restrict the use of a image across various zones or regions.
It is recommended to perform a separate connector installation for each new zone or region you wish to operate in.

### Cause 3: Firewall forbids Scrapoxy access to instances

Scrapoxy needs the ability to access the open port (default is 3128) on the instance.
This access facilitates the acquisition of the instance's fingerprint and enables the proper relay of traffic.
Ensure that your firewall settings include a rule that permits this access.
