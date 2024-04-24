# Bright Data Connector

![Bright Data](/assets/images/brightdata.svg){width=280 nozoom}

[Bright Data](https://get.brightdata.com/khkl3keb25ld) provides award-winning proxy networks, AI-powered web scrapers, 
and business-ready datasets for download. Welcome to the internet’s most trusted web data platform.

::: info
This connector supports Datacenter and ISP proxies, 
with plans to integrate Residential and Mobile proxies in the future.
:::


## Prerequisites

An active Bright Data subscription is required.


## Bright Data Dashboard

Connect to [Dashboard](https://brightdata.com/cp).


### Create a token

![Brightdata New Token Select](brightdata_new_token_select.png)

1. On the left menu, select the wheel at the bottom;
2. Click on `Account settings`.

---

![Brightdata New Token Select 2](brightdata_new_token_select2.png)

Click on `Add token`.

---

![Brightdata New Token Options](brightdata_new_token_opts.png)

1. Select the `Ops` permissions;
2. Click on `Unlimited` or specify a date for a limited token if wanted;
3. Click on `Save`.

---

![Brightdata New Token](brightdata_new_token.png)

1. Remember the token;
2. and click on `Got it`.

### Add a zone

![Brightdata New Zone Select](brightdata_new_zone_select.png)

1. On the left menu, click on the zone icon;
2. Click on `Add`.

---

![Brightdata New Zone](brightdata_new_zone.png)

Choose between Residential, ISP, Datacenter or Mobiles proxies.

For ISP or Datacenter proxies, select the number of required instances.

::: warning
Do not add a Geolocation targeting filter, as Scrapoxy will manage this parameter.
:::


## Scrapoxy

Open Scrapoxy User Interface and select `Marketplace`:


### Step 1: Create a new credential

![Credential Select](spx_credential_select.png)

Select `Brightdata` to create a new credential (use search if necessary).

---

![Credential Form](spx_credential_create.png)

Complete the form with the following information:
1. **Name**: The name of the credential;
2. **Token**: The token.

And click on `Create`.


### Step 2: Create a new connector

Create a new connector and select `BrightData` as provider:

![Connector Create](spx_connector_create.png)

Complete the form with the following information:
1. **Credential**: The previous credential;
2. **Name**: The name of the connector;
3. **# Proxies**: The number of instances to create;
4. **Proxies Timeout**: Maximum duration for connecting to a proxy before considering it as offline;
5. **Proxies Kick**: If enabled, maximum duration for a proxy to be offline before being removed from the pool;
6. **Zone**: The zone to use;
7. **Country**: Select the country to use, or `All` to use all countries.

And click on `Create`.


### Step 3: Start the connector

![Connector Start](spx_connector_start.png)

1. Start the project;
2. Start the connector.


### Step 4: Interact with proxies

![SPX Proxies](spx_proxies.png)

Within this connector, you can perform 2 actions on the proxies:
1. **Trash button**: Initiates a proxy rotation. The session is temporarily removed and will be reused later.
2. **Cross button**: Requests a replacement from BrightData to permanently replace the IP, which comes with associated costs.

::: info
If a country is chosen from the configuration menu,
the trash button will swap the current instance with an instance of the selected country.
:::


### Other: Stop the connector

![Connector Stop](spx_connector_stop.png)

1. Stop the connector;
2. Wait for proxies to be removed.
