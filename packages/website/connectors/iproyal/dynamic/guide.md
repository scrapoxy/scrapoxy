# IPRoyal Dynamic IP Connector

![IPRoyal](/assets/images/iproyal.svg){width=230 nozoom}

[IPRoyal](https://iproyal.com/?r=432273) is a proxy provider that offers a versatile selection of different proxies. These include top-end residential proxies, datacenter proxies, and even niche-specific sneaker proxies

This connector is for Royal Residential Proxies.

::: info
Residential Proxies are accessed via a unique endpoint, and the link is maintained through a sticky session mechanism.
:::


## Prerequisites

An active IPRoyal subscription is required on Royal Residential Proxies.


## IPRoyal Dashboard

Connect to [Dashboard](https://dashboard.iproyal.com?r=432273).


## Get the proxy credentials

![IPRoyal Settings](iproyal_settings.png)

1. On the left menu, select `Royal Residential`;
2. Remember the `Proxy username`;
3. Remember the `Proxy password`.

::: tip
On the password, only keep the first part before the `_` character.
:::


## Scrapoxy

Open Scrapoxy User Interface and select `Marketplace`:


### Step 1: Create a new credential

![Credential Select](spx_credential_select.png)

Select `IPRoyal` with type `Dynamic IP` to create a new credential (use search if necessary).

---

![Credential Form](spx_credential_create.png)

Complete the form with the following information:

1. **Username**: The username of the Proxy;
2. **Password**: The password of the Proxy.

And click on `Create`.


### Step 2: Create a new connector

Create a new connector and select `IPRoyal` as provider:

![Connector Create](spx_connector_create.png)

Complete the form with the following information:
1. **Credential**: The previous credential;
2. **Name**: The name of the connector;
3. **# Proxies**: The number of instances to create;
4. **Proxies Timeout**: Maximum duration for connecting to a proxy before considering it as offline;
5. **Proxies Kick**: If enabled, maximum duration for a proxy to be offline before being removed from the pool;
6. **Country**: Select the country to use, or `All` to use all countries;
7. **TTL**: Select the duration of the sticky session;
8. **High-end Pool**: If enabled, choose only fast and stable proxies from the IP Royal pool.

And click on `Create`.


### Step 3: Start the connector

![Connector Start](../spx_connector_start.png)

1. Start the project;
2. Start the connector.


### Other: Stop the connector

![Connector Stop](../spx_connector_stop.png)

1. Stop the connector;
2. Wait for proxies to be removed.
