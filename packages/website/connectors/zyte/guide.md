# Zyte Connector

![Zyte](/assets/images/zyte.svg){width=150 nozoom}

[Zyte](https://zyte.com) (formely Crawlera) is a proxies service for Data Extraction.


## Prerequisites

An active Zyte **Smart Proxy Manager** subscription is required.

::: info
As of now, Scrapoxy supports only Zyte Smart Proxy Manager.
:::


## Zyte App

Connect to [App](https://app.zyte.com).


### Get the credentials

![Zyte Account Select](zyte_account_select.png)

1. Go to the `Dashboard`;
2. And click on the `Create Account` button.

---

![Zyte Account Create](zyte_account_create.png)

1. Enter `scrapoxy` as `Account Name`;
2. Click on the `Create` button.

---

![Zyte Account Token](zyte_account_token.png)

1. Select the region you want to use and click on `Save`;
2. Remember the `API Key`.


## Scrapoxy

Open Scrapoxy User Interface and select `Marketplace`:


### Step 1: Create a new credential

![Credential Select](spx_credential_select.png)

Select `Zyte` to create a new credential (use search if necessary).

---

![Credential Form](spx_credential_create.png)

Complete the form with the following information:
1. **Name**: The name of the credential;
2. **Token**: The token of the API.

And click on `Create`.


### Step 2: Create a new connector

Create a new connector and select `Zyte` as provider:

![Connector Create](spx_connector_create.png)

Complete the form with the following information:
1. **Credential**: The previous credential;
2. **Name**: The name of the connector;
3. **# Proxies**: The number of instances to create;
4. **Proxies Timeout**: Maximum duration for connecting to a proxy before considering it as offline;
5. **Proxies Kick**: If enabled, maximum duration for a proxy to be offline before being removed from the pool;
6. **Region**: Select the country to use;
7. **API URL**: Set the URL of the Zyte Smart Proxy Manager API (default is `proxy.crawlera.com:8011`).

And click on `Create`.


### Step 3: Start the connector

![Connector Start](spx_connector_start.png)

1. Start the project;
2. Start the connector.


### Other: Stop the connector

![Connector Stop](spx_connector_stop.png)

1. Stop the connector;
2. Wait for proxies to be removed.
