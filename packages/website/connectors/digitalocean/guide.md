# Digital Ocean Connector

![Digital Ocean](/assets/images/digitalocean.svg){width=280 nozoom}

[Digital Ocean](https://digitalocean.com) is an US multinational cloud provider.


## Prerequisites

An active Digital Ocean subscription is required.


## Digital Ocean Admin

Connect to [Admin](https://cloud.digitalocean.com).


### Create new credential

![DO Token](do_token.png)

On the left menu, click on `API` and click on `Generate New Token`.

---

![DO Token New](do_token_new.png)

1. Enter `scrapoxy` as Token name;
2. Select `No expire` for Expiration;
3. Check the `Write` box on Scopes
4. And click on `Generate Token`.

---

![DO Token New Save](do_token_new_save.png)

Remember the `Token` value.


## Scrapoxy

Open Scrapoxy User Interface and select `Credentials`:


### Step 1: Create a new credential

![Credential Select](spx_credential_select.png)

Create a new credential and select `Digital Ocean` as provider.

---

![Credential Form](spx_credential_create.png)

Complete the form with the following information:
1. **Name**: The name of the credential;
2. **Access key ID**: The Access key ID of the account;
3. **Secret access key**: The Client Secret of the account.

And click on `Create`.


### Step 2: Create a new connector

Create a new connector and select `Digital Ocean` as provider:

![Connector Create](spx_connector_create.png)

Complete the form with the following information:
1. **Credential**: The previous credential;
2. **Name**: The name of the connector;
3. **# Proxies**: The number of instances to create;
4. **Region**: The region where the instances will be created;
5. **Port**: The port of the proxy (on Digital Ocean);
6. **Size**: The type of the instance;
7. **Snapshot**: The name of the snapshot to use. ⚠️ Don't fill it, it will be created automatically during installation;
8. **Security group name**: The name of the security group containing the firewall rules;
9. **Tag**: The default tag for instance.

And click on `Create`.

::: tip
You can retain most of the default values if they are suitable for your use case.
:::


### Step 3: Install the connector

![Connector Install Select](spx_connector_install_select.png)

On the connector list, click on `Install`.

---

![Connector Install](spx_connector_install.png)

Click on `Install`.

Scrapoxy will start, install and stop the VM to create a custom image.

---

![Connector Installed](spx_connector_installed.png)

When the installation is finished, click on `Connectors`.

---

![Connector Start](spx_connector_start.png)

1. Start the project;
2. Start the connector.


### Other: Uninstall the connector

![Connector Stop](spx_connector_stop.png)

1. Stop the connector;
2. Wait for proxies to be removed.

---

![Connector Uninstall Select](spx_connector_uninstall_select.png)

On the connector list, click on `Uninstall`.

---

![Connector Uninstalled](spx_connector_uninstall_confirm.png)

Confirm the uninstallation.

![Connector Uninstalled](spx_connector_uninstalled.png)

Wait for the uninstallation to finish: Scrapoxy will delete the custom image.
