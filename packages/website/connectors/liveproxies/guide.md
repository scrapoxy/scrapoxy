# Live Proxies Connector

![Live Proxies](/assets/images/liveproxies.svg){width=230 nozoom}

[Live Proxies](/l/liveproxies) provides top notch private residential proxies tailored to businesses and individuals.


## Prerequisites

An active Live Proxies subscription is required.


## Live Proxies Dashboard

Connect to [Dashboard](/l/liveproxies-dashboard).


### Get the credentials

![Live Proxies API Key](liveproxies_apikey.png)

1. Click on the `Settings` tab
2. Click on `Generate API Key` to create a new key
3. Click on `Copy` to save the key in the clipboard.


## Scrapoxy

Open Scrapoxy User Interface and select `Marketplace`:


### Step 1: Create a new credential

![Credential Select](spx_credential_select.png)

Select `Live Proxies` to create a new credential (use search if necessary).


---

![Credential Form](spx_credential_create.png)

Complete the form with the following information:
1. **Name**: The name of the credential;
2. **API Key**: The key of the API.

And click on `Create`.


### Step 2: Create a new connector

Create a new connector and select `Rayobyte` as provider:

![Connector Create](spx_connector_create.png)

Complete the form with the following information:
1. **Credential**: The previous credential;
2. **Name**: The name of the connector;
3. **# Proxies**: The number of instances to create;
4. **Proxies Timeout**: Maximum duration for connecting to a proxy before considering it as offline;
5. **Proxies Kick**: If enabled, maximum duration for a proxy to be offline before being removed from the pool;
6. **Plan**: Select the plan to use;
7. **Country**: Select the country to use, or `All` to use all countries. This menu only appears for `Enterprise` plan.

And click on `Create`.


### Step 3: Start the connector

![Connector Start](spx_connector_start.png)

1. Start the project;
2. Start the connector.

::: info
If the proxies were just ordered, it may take between 5 and 10 minutes to be available.
:::


### Other: Stop the connector

![Connector Stop](spx_connector_stop.png)

1. Stop the connector;
2. Wait for proxies to be removed.
