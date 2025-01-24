# Proxy-Cheap Connector

![Proxy-Cheap](/assets/images/proxy-cheap.svg){width=230 nozoom}

[Proxy-Cheap](/l/proxy-cheap) offers enterprise-level proxies for novices and professionals. They provide affordable solutions for customers to obtain data and circumvent restrictions while operating at scale. Theirs solutions serve customers from data scraping to market research and other industries. 

This connector is for Mobile Proxies, Static Residential Proxies and Datacenter Proxies.

::: info
Mobile proxies need a whitelisted IP address. This configuration is available in the [Dashboard](/l/proxy-cheap-dashboard).
:::


## Prerequisites

An active Proxy-Cheap subscription is required on Mobile Proxies, Static Residential Proxies or Datacenter Proxies.


## Proxy-Cheap Dashboard

Connect to [Dashboard](/l/proxy-cheap-dashboard).


### Get the API Key

![Proxy-Cheap Credentials Key Create](pc_credentials_key_create.png)

1. On the top left menu, click on `Api Keys`;
2. Click on `Generate new API Key`;
3. Remember the `API Key`;
4. Remember the `API Secret`.


## Scrapoxy

Open Scrapoxy User Interface and select `Marketplace`:


### Step 1: Create a new credential

![Credential Select](spx_credential_select.png)

Select `Proxy-Cheap` with type `Static IP` to create a new credential (use search if necessary).

---

![Credential Form](spx_credential_create.png)

Complete the form with the following information:
1. **Name**: The name of the credential;
2. **Key**: The key of the API;
3. **Secret**: The secret of the API.

And click on `Create`.


### Step 2: Create a new connector

Create a new connector and select `Proxy-Cheap` as provider:

![Connector Create](spx_connector_create.png)

Complete the form with the following information:
1. **Credential**: The previous credential;
2. **Name**: The name of the connector;
3. **# Proxies**: The number of instances to create;
4. **Type**: Select the type to use (Datacenter, Static Residential or Mobile), or `All` to use all products.

And click on `Create`.


### Step 3: Start the connector

![Connector Start](../spx_connector_start.png)

1. Start the project;
2. Start the connector.


### Other: Stop the connector

![Connector Stop](../spx_connector_stop.png)

1. Stop the connector;
2. Wait for proxies to be removed.
