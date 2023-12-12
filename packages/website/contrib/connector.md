# Build a new connector

## Template

Crafting a new connector is recommended by duplicating an existing connector and customizing it according to specific needs.
Begin with one of the following options:
- **AWS Connector**: Ideal for cloud providers;
- **Rayobyte Connector**: Suited for static proxy providers (which provides many endpoints, one by proxy);
- **Zyte Connector**: Designed for dynamic proxy providers with a unique API;
- **Proxidize Connector**: Appropriate for hardware providers.



## Run a test

For comprehensive submissions, ensure to include a test, 
even for new connectors (I'll handle the credential for the PR, no need to worry about that).

I advise running one test at a time:

```shell
export DOTENV_FILE=packages/backend/test/src/assets/storage-file.env

nx run connector-aws-test:test-connector
```

::: warning
Exercise caution when running tests on cloud providers; 
any failed tests may result in charges for remaining resources.
**Don't forget to delete them after testing.**
:::
