# Get Started

## With Docker

Open the terminal and run the following **Docker** command:

```shell
docker run -d -p 8888:8888 -p 8890:8890 \
  -e AUTH_LOCAL_USERNAME=admin -e AUTH_LOCAL_PASSWORD=password \
  -e BACKEND_JWT_SECRET=secret1 -e FRONTEND_JWT_SECRET=secret2 \
  fabienvauchelles/scrapoxy
```

User interface is now running on http://localhost:8890 with `admin` as username and `password` as password.

## With NPM

Open the terminal and run the following **NPX** command:

```shell
AUTH_LOCAL_USERNAME=admin \
  AUTH_LOCAL_PASSWORD=password \
  BACKEND_JWT_SECRET=secret1 \
  FRONTEND_JWT_SECRET=secret2 \
  npx scrapoxy
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

