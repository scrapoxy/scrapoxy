# Proxy-Cheap Connector

![Proxy-Cheap](/assets/images/proxy-cheap.svg){width=230 nozoom}

[Proxy-Cheap](/l/proxy-cheap) offers enterprise-level proxies for novices and professionals. They provide affordable solutions for customers to obtain data and circumvent restrictions while operating at scale. Theirs solutions serve customers from data scraping to market research and other industries. 

This connector is for Rotating Residential Proxies.


## Prerequisites

An active Proxy-Cheap subscription is required on Residential Proxies.


## Proxy-Cheap Dashboard

Connect to [Dashboard](/l/proxy-cheap-dashboard).


### Get the proxy credentials

![PC Residential Select](pc_select.png)

1. On the left menu, select `My Proxies`;
2. Click on the line tagged as `ROTATING RESIDENTIAL`.

---

![PC Residential Credentials](pc_credentials.png)

1. Remember the `Username`;
2. Remember the `Password`.


## Scrapoxy

Open Scrapoxy User Interface and select `Marketplace`:


### Step 1: Create a new credential

![Credential Select](spx_credential_select.png)

Select `Proxy-Cheap` with type `Dynamic IP` to create a new credential (use search if necessary).

---

![Credential Form](spx_credential_create.png)

Complete the form with the following information:
1. **Name**: The name of the credential;
2. **Username**: The username of the proxy;
3. **Password**: The password of the proxy.

And click on `Create`.


### Step 2: Create a new connector

Create a new connector and select `Proxy-Cheap` as provider:

![Connector Create](spx_connector_create.png)

Complete the form with the following information:
1. **Credential**: The previous credential;
2. **Name**: The name of the connector;
3. **# Proxies**: The number of instances to create;
4. **Country**: Select the country to use, or `All` to use all countries;

And click on `Create`.


### Step 3: Start the connector

![Connector Start](../spx_connector_start.png)

1. Start the project;
2. Start the connector.


### Other: Stop the connector

![Connector Stop](../spx_connector_stop.png)

1. Stop the connector;
2. Wait for proxies to be removed.
