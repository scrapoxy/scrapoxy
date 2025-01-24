# Proxy-Seller Connector

![Proxy-Seller](/assets/images/proxy-seller.svg){width=260 nozoom}

[Proxy-Seller](/l/proxy-seller) offers DC/ISP/Mobile proxy service offers businesses a high-quality, cost-effective solution for reliable data access, tailored to meet the demands of professional use.

This connector is for Mobile Proxies, ISP Proxies and Datacenter Proxies.

Check out this [video](/l/youtube-proxy-seller):

<iframe width="560" height="315" src="https://www.youtube.com/embed/uGkVpWpBGDs" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>


## Prerequisites

An active Proxy-Seller subscription is required on Mobile Proxies, ISP Proxies or Datacenter Proxies.


## Proxy-Seller Dashboard

Connect to [Dashboard](/l/proxy-seller-dashboard).


### Get the API credentials

![PS Credentials token](../ps_credentials_token.png)

1. On the top right menu, click on your account;
2. Select `API` menu;
3. Check that your are on the `API` tab;
4. Remember the `Token`.


## Scrapoxy

Open Scrapoxy User Interface and select `Marketplace`:


### Step 1: Create a new credential

![Credential Select](spx_credential_select.png)

Select `Proxy-Seller` with type `Static IP` to create a new credential (use search if necessary).

---

![Credential Form](spx_credential_create.png)

Complete the form with the following information:
1. **Name**: The name of the credential;
2. **Token**: The token of the API;

And click on `Create`.


### Step 2: Create a new connector

Create a new connector and select `Proxy-Seller` as provider:

![Connector Create](spx_connector_create.png)

Complete the form with the following information:
1. **Credential**: The previous credential;
2. **Name**: The name of the connector;
3. **# Proxies**: The number of instances to create.
4. **Proxies Timeout**: Maximum duration for connecting to a proxy before considering it as offline;
5. **Proxies Kick**: If enabled, maximum duration for a proxy to be offline before being removed from the pool;
6. **Type**: Select the type to use (Datacenter, ISP or Mobile), or `All` to use all products.
7. **Country**: Select the country to use, or `All` to use all countries;

And click on `Create`.


### Step 3: Start the connector

![Connector Start](../spx_connector_start.png)

1. Start the project;
2. Start the connector.


### Other: Stop the connector

![Connector Stop](../spx_connector_stop.png)

1. Stop the connector;
2. Wait for proxies to be removed.
