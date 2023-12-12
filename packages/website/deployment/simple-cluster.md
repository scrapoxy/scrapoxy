# Cluster with file storage Deployment

This deployment consists of 3 instances:
- 1 Commander instance with file storage;
- 1 Master instance;
- 1 Refresh instance.

For additional details, refer to the [Architecture](/architecture/overview) section.


## Docker Compose

Edit `docker-compose.yml` with the following content:

```yaml
services:
    commander:
        image: fabienvauchelles/scrapoxy
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

    master:
        image: fabienvauchelles/scrapoxy
        command: "node scrapoxy.js start -m"
        ports:
            - 8888:8888
        environment:
            - NODE_ENV=production
            - COMMANDER_URL=http://commander:8890/api
            - BACKEND_JWT_SECRET=secret1
        links:
            - commander

    refresh:
        image: fabienvauchelles/scrapoxy
        command: "node scrapoxy.js start -r"
        environment:
            - NODE_ENV=production
            - COMMANDER_URL=http://commander:8890/api
            - BACKEND_JWT_SECRET=secret1
        links:
            - commander
```

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
