# Single instance with file storage Deployment

This deployment runs a single container that encapsulates all components, including the storage, within a single file.

It is designed to handle fewer than 100 concurrent requests.

For greater scalability, consider configuring a [simple cluster](./simple-cluster).


## Docker

Scrapoxy is hosted on Docker hub: [scrapoxy/scrapoxy](/l/docker-scrapoxy).


### Volume

Start Scrapoxy with a volume for the configuration file:

```shell
docker run -d -p 8888:8888 -p 8890:8890 \
  -e AUTH_LOCAL_USERNAME=admin -e AUTH_LOCAL_PASSWORD=password \
  -e BACKEND_JWT_SECRET=secret1 -e FRONTEND_JWT_SECRET=secret2 \
  -e STORAGE_FILE_FILENAME=/etc/scrapoxy/config.json \
  -v ./scrapoxy:/etc/scrapoxy \
  scrapoxy/scrapoxy
```

:::info
The file `./scrapoxy/config.json` contains the configuration on the host machine.
:::


### Production mode

To limit the log level, set the environment variable `NODE_ENV` to `production`:

```shell
docker run -d -p 8888:8888 -p 8890:8890 \
  -e AUTH_LOCAL_USERNAME=admin -e AUTH_LOCAL_PASSWORD=password \
  -e BACKEND_JWT_SECRET=secret1 -e FRONTEND_JWT_SECRET=secret2 \
  -e NODE_ENV=production \
  scrapoxy/scrapoxy
```


## Docker Compose

Create a `docker-compose.yml` file with the following content:

```yaml
version: '3'

services:
  scrapoxy:
    image: scrapoxy/scrapoxy
    ports:
      - 8888:8888
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
name: scrapoxy
description: Scrapoxy Single Instance
type: application
version: 1.0.0
appVersion: latest
dependencies:
    -   name: scrapoxy
        version: 1.0.0
        repository: https://charts.scrapoxy.io
```

Edit `values.yaml` with the following content:

```yaml
scrapoxy:
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
