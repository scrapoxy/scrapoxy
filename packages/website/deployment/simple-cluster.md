# Cluster with file storage Deployment

This deployment consists of 4 instances:
- 1 Commander instance with file storage;
- 2 Master instances;
- 1 Refresh instance.

For additional details, refer to the [Architecture](/architecture/overview) section.

::: warning
Use a separate instance for running Scrapoxy at scale.
Don’t run **VPNs** or **complicated network setups** on the same machine, 
as this can cause connection problems, especially when scaling up.
:::

## Docker Compose

Create a `haproxy.cfg` file with the following content:

```cfg
resolvers default
    parse-resolv-conf

frontend master
    mode tcp
    bind :8888
    default_backend all

backend all
    mode tcp
    server-template master 2 master:8888 check init-addr last,none resolvers default
```

Adjust the `server-template` directive to align the required number of Master instances based on the [desired sizing](#sizing).

---

In the same directory, create a `docker-compose.yml` file with the following content:

```yaml
services:
    commander:
        image: scrapoxy/scrapoxy
        command: "node scrapoxy.js start -f -c --storage file"
        ports:
            - 8890:8890
        environment:
            - NODE_ENV=production
            - AUTH_LOCAL_USERNAME=admin
            - AUTH_LOCAL_PASSWORD=password
            - BACKEND_JWT_SECRET=secret1
            - FRONTEND_JWT_SECRET=secret2
            - STORAGE_FILE_FILENAME=/etc/scrapoxy/config.json
        volumes:
            - ./scrapoxy:/etc/scrapoxy

    haproxy:
        image: haproxy
        ports:
            - 8888:8888
        volumes:
            - ./haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg:ro

    master:
        image: scrapoxy/scrapoxy
        command: "node scrapoxy.js start -m"
        deploy:
            mode: replicated
            replicas: 2
            endpoint_mode: dnsrr
        environment:
            - NODE_ENV=production
            - COMMANDER_URL=http://commander:8890/api
            - BACKEND_JWT_SECRET=secret1
        links:
            - commander

    refresh:
        image: scrapoxy/scrapoxy
        command: "node scrapoxy.js start -r"
        environment:
            - NODE_ENV=production
            - COMMANDER_URL=http://commander:8890/api
            - BACKEND_JWT_SECRET=secret1
        links:
            - commander
```

Make sure to update the `replicas` field un `master` service to match the number of Master instances required.

---

Run the following command:

```shell
docker compose up -d
```

## Kubernetes with Helm

Create an umbrella chart with Helm with the following files structure:

```
myscrapoxy/
|- Chart.yaml
|- values.yaml
```

Edit `Chart.yaml` with the following content:

```yaml
apiVersion: v2
name: scrapoxy-simple-cluster
description: Scrapoxy Simple Cluster
type: application
version: 1.0.0
appVersion: latest
dependencies:
    -   name: scrapoxy-simple-cluster
        version: 1.0.0
        repository: https://charts.scrapoxy.io
```

Edit `values.yaml` with the following content:

```yaml
scrapoxy-simple-cluster:
    auth:
        local:
            username: "admin"
            password: "password"

    backendJwtSecret: "secret1"
    frontendJwtSecret: "secret2"
```

Build dependencies:

```shell
helm dependency build ./myscrapoxy
```

Install the chart:

```shell
helm install scrapoxy ./myscrapoxy
```


## Sizing

The master instance handles all requests, so it's the one to scale the most.

Here’s a reference table:

| Max concurrent requests | Number of Masters | Number of vCPU |
|-------------------------|-------------------|----------------|
| 100                     | 1                 | 2              |
| 200                     | 2                 | 3              |
| 500                     | 3                 | 4              |
| 1000                    | 4                 | 5              |
