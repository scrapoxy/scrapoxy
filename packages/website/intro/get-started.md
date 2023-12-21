# Get Started

## With Docker

Ensure that [Docker](https://www.docker.com) is installed on your computer.

Open the **terminal** and run the following command:

```shell
docker run -d -p 8888:8888 -p 8890:8890 -e AUTH_LOCAL_USERNAME=admin -e AUTH_LOCAL_PASSWORD=password -e BACKEND_JWT_SECRET=secret1 -e FRONTEND_JWT_SECRET=secret2 fabienvauchelles/scrapoxy
```

User interface is now running on http://localhost:8890 with `admin` as username and `password` as password.


## With NPM

Make sure that [Node.js](https://nodejs.org) is installed on your computer.

### On Linux

Open the **terminal** and run the following command:

```shell
AUTH_LOCAL_USERNAME=admin AUTH_LOCAL_PASSWORD=password BACKEND_JWT_SECRET=secret1 FRONTEND_JWT_SECRET=secret2 npx --yes scrapoxy
```


### On Windows

Open the **Command Prompt** and run the following command:

```shell
set AUTH_LOCAL_USERNAME=admin
set AUTH_LOCAL_PASSWORD=password
set BACKEND_JWT_SECRET=secret1
set FRONTEND_JWT_SECRET=secret2
npx --yes scrapoxy
```

---

::: tip
In both case, don't forget to replace `admin`, `password`, `secret1` and `secret2` with your own values.
:::

Also, don't worry if you get the following error at the first start:

```shell
Cannot read store: ENOENT: no such file or directory, open 'scrapoxy.json' 
```

Scrapoxy hasn't created the configuration file yet.
