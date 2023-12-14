# IPRoyal Connector

![IPRoyal](/assets/images/iproyal.svg){width=230 nozoom}

[IPRoyal](https://iproyal.com) is a proxy provider that offers a versatile selection of different proxies. These include top-end residential proxies, datacenter proxies, and even niche-specific sneaker proxies

::: info
Currently, this connector supports only **Static Residential** proxies.
:::


## Prerequisites

An active IPRoyal subscription is required.


## IPRoyal Dashboard

Connect to [Dashboard](https://dashboard.iproyal.com).


### Get the credentials

![IPRoyal Settings Select](iproyal_settings_select.png)

1. On the top right menu, click on your username;
2. Click on `Settings`.

---

![IPRoyal Token](iproyal_token.png)

Remember `API Token`.


## Scrapoxy

Open Scrapoxy User Interface and select `Credentials`:


### Step 1: Create a new credential

![Credential Select](spx_credential_select.png)

Create a new credential and select `IPRoyal` as provider.

---

![Credential Form](spx_credential_create.png)

Complete the form with the following information:
1. **Name**: The name of the credential;
2. **Token**: The token of the API.

And click on `Create`.


### Step 2: Create a new connector

Create a new connector and select `IPRoyal` as provider:

![Connector Create](spx_connector_create.png)

Complete the form with the following information:
1. **Credential**: The previous credential;
2. **Name**: The name of the connector;
3. **# Proxies**: The number of instances to create;
4. **Product**: Select the product to use, or `All` to use all products;
5. **Country**: Select the country to use, or `All` to use all countries.

And click on `Create`.


### Step 3: Start the connector

![Connector Start](spx_connector_start.png)

1. Start the project;
2. Start the connector.


### Other: Stop the connector

![Connector Stop](spx_connector_stop.png)

1. Stop the connector;
2. Wait for proxies to be removed.
