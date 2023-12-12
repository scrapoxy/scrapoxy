# Project Structure

The Scrapoxy repository follows the [NX](https://nx.dev) mono-repository pattern.

It contains all the packages associated with the project.


## Root structure

The root structure of the Scrapoxy repository is organized as follows:

```text
scrapoxy
|-- .husky                       | Commit hooks
|-- .idea                        | IntelliJ IDEA configuration
|-- packages                     | Source code of the project
|-- tools                        | Tools to generate monitor and generate traffic
|-- .editorconfig                | Generic linting rules
|-- .gitignore                   | Git ignore rules
|-- .gitleaksignore              | Gitleaks ignore rules to avoid commit secrets
|-- .lintstagedrc.js             | Linting for Git staged files
|-- .stylelintrc.js              | CSS/SCSS linting configuration
|-- commitlint.config.js         | Linting for commit messages    
|-- jest.config.ts               | Jest root configuration
|-- jest.preset.js               | Jest preset configuration
|-- LICENCE.md                   | MIT licence
|-- nx.json                      | NX configuration
|-- package.json                 | NPM configuration
|-- scrapoxy.iml                 | IntelliJ project IDEA configuration
|-- tsconfig.base.json           | Global Typescript configuration
|-- tsconfig-frontend.base.json  | Global Typescript configuration for frontend, inherited from tsconfig.base.json
```

This structure provides an overview of the essential components and configurations in the Scrapoxy repository.


## Packages structure

The `packages` folder in Scrapoxy's repository is structured as follows:

```text
packages 
|-- auths          | Authentication methods 
  |-- github       | Github OAuth authentication
  |-- google       | Google OAuth authentication
  |-- local        | Local authentication (username / password)
|-- backend        | Backend application
  |-- app          | Main application in NestJS
  |-- sdk          | Shared library between backend and connectors module
  |-- test         | End-to-end tests
  |-- test-sdk     | Shared library for tests
|-- charts         | Helm charts
|-- cloudlocal     | Emulate a cloud provider locally (for tests purpose)
|-- common           Shared library for the whole project
|-- connectors     | All the connectors logic
  |-- aws          | AWS connector
    |-- backend    | Backend part of the connector
    |-- frontend   | Connector's configuration in the UI
    |-- sdk        | Shared library for AWS
    |-- test       | End-to-end tests for the connector
  |-- azure        | Azure connector
  ...              | Other connectors
|-- frontend       | Frontend application
  |-- app          | Main Angular Application
  |-- sdk          | Shared library between frontend and connectors module
|-- proxy          | Proxy application for VM deployment (cloud provider only)
|-- proxylocal     | Emulate a proxies service locally (for tests purpose)
|-- python-api     | PyPI (for Python and Scrapy) 
|-- storages       | Storage methods
  |-- distributed  | Distributed storage with CQRS architecture
  |-- local        | File and memory storage
|-- website        | Scrapoxy's website
```

This structure organizes Scrapoxy's codebase into different modules, each responsible for specific functionality,
such as authentication, connectors, backend, frontend, storage, and more.
