# Command Line Usage

Basic usage of Scrapoxy via the command line is covered here.

For more configuration, check out the [environment variables](env.md).


## Minimum versions

Scrapoxy requires a minimum version of:
- NodeJS: 20.x.x
- NPM: 8.x.x


## Installation

Open a terminal and run the following command:

```bash
npm install -g scrapoxy
```

## Usage

Start Scrapoxy with the following command:

```bash
scrapoxy start [options]
```

### Options

Options are **optional** and are:

| Option                  | Shortcut | Description                                                                                  |
|-------------------------|----------|----------------------------------------------------------------------------------------------|
| `--standalone`          | `-s`     | Run as a standalone instance (equivalent to `-m -c -f -r --storage file`)                    |
| `--master`              | `-m`     | Run the Master module                                                                        |
| `--commander`           | `-c`     | Run the Commander module                                                                     |
| `--frontend`            | `-f`     | Serve the User interface                                                                     |
| `--refresh-all`         | `-r`     | Run the all the Refresh modules (includes all `--refresh-xxx` options)                       |
| `--refresh-connectors`  |          | Run the Connectors refresh module                                                            |
| `--refresh-freeproxies` |          | Run the Freeproxies refresh module                                                           |
| `--refresh-metrics`     |          | Run the Metrics refresh module                                                               |
| `--refresh-proxies`     |          | Run the Proxies refresh module                                                               |
| `--refresh-tasks`       |          | Run the Tasks refresh module                                                                 |
| `--storage <type>`      |          | Choose storage between `file`, `distributed` or `memory`)                                    |
| `--distributed <mode>`  |          | Choose distributed storage mode with `--storage distributed` between `read`, `write`, `both` |
| `--help`                | `-h`     | Display help for the command                                                                 |


There is the flexibility to launch each module individually, group modules, or initiate all modules simultaneously.
The default storage setting is `file`.

For additional details on the Master, Commander, Frontend, or Refresh modules, refer to the [Architecture](/architecture/overview) section.
