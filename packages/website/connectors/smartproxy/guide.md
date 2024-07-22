# Smartproxy Connector

![Smartproxy](/assets/images/smartproxy.svg){width=280 nozoom}

[Smartproxy](https://smartproxy.pxf.io/Qy5mVo) is the award-winning proxy service provider with efficient data extraction and multi-accounting infrastructure.
They provides access to 65M+ global IPs.


::: info
This connector supports Residential proxies, ISP proxies and Datacenter proxies
with plans to integrate Mobile proxies in the future.
:::


## Prerequisites

An active Smartproxy subscription is required.


## Smartproxy Dashboard

Connect to [Dashboard](https://dashboard.smartproxy.com).

You need to create a new credential for each type of product.

### Residential Proxies

![Smartproxy Residential Proxies](smartproxy_credentials_residential.png)

1. On the left menu, select `Residential Proxies` > `Residential`;
2. Remember the username;
3. Remember the password.


### Mobile Proxies

![Smartproxy Mobile Proxies](smartproxy_credentials_mobile.png)

1. On the left menu, select `Residential Proxies` > `Mobile`;
2. Remember the username;
3. Remember the password.


### ISP Proxies - Pay/GB

![Smartproxy ISP Pay GB](smartproxy_credentials_isp_pay_gb.png)

1. On the left menu, select `ISP Proxies` > `ISP Pay/GB`;
2. Remember the username;
3. Remember the password.


### ISP Proxies - Dedicated ISP

![Smartproxy Dedicated ISP](smartproxy_credentials_isp_dedicated.png)

1. On the left menu, select `ISP Proxies` > `Dedicated ISP`;
2. Remember the username;
3. Remember the password.


### Datacenter Proxies - Pay/GB

::: info
For Datacenter Pay/GB proxies, you need to reset the password if you can't remember it.
:::

![Smartproxy Datacenter Pay GB 1](smartproxy_credentials_dc_pay_gb_1.png)

1. On the left menu, select `Datacenter Proxies` > `Datacenter Pay/GB`;
2. Click on the `Edit` button.

---

![Smartproxy Datacenter Pay GB 1](smartproxy_credentials_dc_pay_gb_2.png)

1. Remember the username;
2. Change the password, remember and save it.


### Datacenter Proxies - Pay/IP

![Smartproxy Datacenter Pay IP](smartproxy_credentials_dc_pay_ip.png)

1. On the left menu, select `Datacenter Proxies` > `Datacenter Pay/IP`;
2. Remember the username;
3. Remember the password.


## Scrapoxy

Open Scrapoxy User Interface and select `Marketplace`:


### Step 1: Create a new credential

![Credential Select](spx_credential_select.png)

Select `Smartproxy` to create a new credential (use search if necessary).

---

![Credential Form](spx_credential_create.png)

Complete the form with the following information:
1. **Name**: The name of the credential;
2. **Product**: The type of product;
3. **Username**: The username;
4. **Password**: The password.

And click on `Create`.

::: info
If you switch to a different product type, remember to copy and paste the new username and password.
:::


### Step 2: Create a new connector

Create a new connector and select `Smartproxy` as provider:

![Connector Create](spx_connector_create.png)

Complete the form with the following information:
1. **Credential**: The previous credential;
2. **Name**: The name of the connector;
3. **# Proxies**: The number of instances to create;
4. **Proxies Timeout**: Maximum duration for connecting to a proxy before considering it as offline;
5. **Proxies Kick**: If enabled, maximum duration for a proxy to be offline before being removed from the pool;
6. **Country**: Select the country to use, or `All` to use all countries.

And click on `Create`.


### Step 3: Start the connector

![Connector Start](spx_connector_start.png)

1. Start the project;
2. Start the connector.


### Other: Stop the connector

![Connector Stop](spx_connector_stop.png)

1. Stop the connector;
2. Wait for proxies to be removed.
