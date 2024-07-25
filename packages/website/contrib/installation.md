# Install the development environment

## Requirements

### OS

Ubuntu 23.04 or later is recommended, but any Linux distribution should work.

It has also been tested on Windows but it requires more configuration (see below).

### Software

Scrapoxy requires:

- [Node.js](https://nodejs.org): 20.0.0 or later; 
- [Java](https://openjdk.org): 8 or later;
- [Python](https://www.python.org): 3.6 or later;
- [Gitleaks](https://github.com/gitleaks/gitleaks)


## Get the repository

Clone the repository:

```shell
git clone git@github.com:fabienvauchelles/scrapoxy.git

cd scrapoxy
```


## Install dependencies

### Platform specific: Windows

For Windows development, make sure to install the following dependencies **before** proceeding with the Node.js dependencies installation:

```shell
npm install --save-dev @nx/nx-win32-x64-msvc @rollup/rollup-win32-x64-msvc
```


### Platform specific: MacOS

For MacOS development, make sure to install the following dependencies **before** proceeding with the Node.js dependencies installation:

```shell
npm install --save-dev @nx/nx-darwin-arm64 @rollup/rollup-darwin-arm64
```


### Node.js dependencies

Install Node.js dependencies: 

```shell
npm install
```

## Update test configuration

In the folder `packages/backend/test/src/assets`, open the files:
- `storage-file.env`, 
- `storage-memory.env` 
- `storage-distributed.env`

And update the following values:
- `PYTHON`: path to Python executable
- `JAVA`: path to Java executable


## Build the project

```shell
npm run build
```


## Run all tests

The file `storage-file.env` contains the variables to run the tests.

Before running the tests, you need to set the environment variable `DOTENV_FILE` to the path of the file `storage-file.env`:

```shell
export DOTENV_FILE=packages/backend/test/src/assets/storage-file.env
```

On Windows, replace `export` by `set`. 

::: tip
You can replace `storage-file.env` by `storage-memory.env` or `storage-distributed.env` to test other storage.
:::

Then, run the tests:

```shell
npm run test
```


## Run the linter

```shell
npm run lint
```


## Start the development environment

In a first terminal, run the backend:

```shell
export COMMANDER_PORT=8889
export AUTH_LOCAL_USERNAME=admin
export AUTH_LOCAL_PASSWORD=password
export BACKEND_JWT_SECRET=secret1
export FRONTEND_JWT_SECRET=secret2

npm run start:backend-app
```

On Windows, replace `export` by `set`.

---

In a second terminal, run the frontend:

```shell
npm run start:frontend-app
```
