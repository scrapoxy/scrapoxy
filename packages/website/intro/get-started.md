# Get Started

## With Docker

Ensure that [Docker](https://www.docker.com) is installed on your computer.

Open the **terminal** and run the following command:

```shell
docker run -d -p 8888:8888 -p 8890:8890 -v ./scrapoxy:/cfg -e AUTH_LOCAL_USERNAME=admin -e AUTH_LOCAL_PASSWORD=password -e BACKEND_JWT_SECRET=secret1 -e FRONTEND_JWT_SECRET=secret2 -e STORAGE_FILE_FILENAME=/cfg/scrapoxy.json scrapoxy/scrapoxy
```

Replace `admin`, `password`, `secret1` and `secret2` with your own values.

User interface is now running on http://localhost:8890 with `admin` as username and `password` as password.

:::tip
To upgrade Scrapoxy, pull the latest image with `docker pull scrapoxy/scrapoxy`.
:::


## With NPM

Make sure that [Node.js](https://nodejs.org) is installed on your computer.

### On Linux

Open the **terminal** and run the following command:

```shell
AUTH_LOCAL_USERNAME=admin AUTH_LOCAL_PASSWORD=password BACKEND_JWT_SECRET=secret1 FRONTEND_JWT_SECRET=secret2 npx --yes scrapoxy
```

Replace `admin`, `password`, `secret1` and `secret2` with your own values.


### On Windows

Open the **Command Prompt** and run the following command:

```shell
set AUTH_LOCAL_USERNAME=admin
set AUTH_LOCAL_PASSWORD=password
set BACKEND_JWT_SECRET=secret1
set FRONTEND_JWT_SECRET=secret2
npx --yes scrapoxy
```

Replace `admin`, `password`, `secret1` and `secret2` with your own values.
