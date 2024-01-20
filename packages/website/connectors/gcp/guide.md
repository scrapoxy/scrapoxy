# Google Cloud Platform Connector

![GCP](/assets/images/gcp.svg){width=280 nozoom}

[Google Cloud Platform](https://cloud.google.com) is a cloud computing services that runs on the same infrastructure
that Google uses internally.


## Prerequisites

An active GCP subscription is required.


## GCP Console

Connect to [Console](https://console.cloud.google.com).


### Step 1: Create new project

![GCP Project Create Select](gcp_project_create_select.png)

1. On the top left, click on the current project,
2. And click on `NEW PROJECT`.

---

![GCP Project Create](gcp_project_create.png)

1. Enter `scrapoxy` as Project name;
2. And click on `CREATE`.

---

Wait for the project to be created. A notification appears when it's done:

![GCP Project Select](gcp_project_select.png)

Click on `SELECT PROJECT`.


### Step 2: Create new credential

![GCP APIs Select](gcp_apis_select.png)

1. On the top left, click on the hamburger menu;
2. Click on `APIs & Services`;
3. And click on `Enabled APIs & services`.

---

![GCP APIs Select2](gcp_apis_select2.png)

1. On tab `Enabled APIs & services`,
2. Click on `+ ENABLE APIS AND SERVICES`.

---

![GCP API Compute Select](gcp_api_compute_select.png)

1. Search `compute`;
2. In the category `Compute`,
3. Click on `Compute Engine API`.

---

![GCP API Compute Enable](gcp_api_compute_enable.png)

Click on `ENABLE`.

---

![GCP API Credentials Select](gcp_credentials_select.png)

1. On the top left, click on the hamburger menu;
2. Click on `APIs & Services`;
3. And click on `Credentials`.

---

![GCP API Credential Select](gcp_credential_select.png)

1. Click on `Credentials`
2. And click on the first service account
---

![GCP Credential Newkey Select](gcp_credential_newkey_select.png)

1. Select `KEYS` tab;
2. Click on `ADD KEY`;
3. And click on `Create new key`.

---

![GCP Credential Newkey](gcp_credential_newkey.png)

1. Select `JSON` as key type;
2. And click on `CREATE`.

---

![GCP Credential JSON](gcp_credential_json.png)

Open the downloaded file and copy the content in the clipboard.

::: info
The copied content will be paste into Scrapoxy with the `Clipboard` button (see below).
:::


## Scrapoxy

Open Scrapoxy User Interface and select `Marketplace`:


### Step 1: Create a new credential

![Credential Select](spx_credential_select.png)

Select `GCP` as provider to create a new credential (use search if necessary).

---

![Credential Form](spx_credential_create.png)

1. Complete the **Name** of the credential;
2. Click on the `Clipboard` icon to paste the JSON content previously copied. It will automatically complete the form;
3. Click on `Create`.

::: tip
It is recommended to copy and paste the credential from the JSON file to prevent any potential typing errors.
:::


### Step 2: Create a new connector

Create a new connector and select `GCP` as provider:

![Connector Create](spx_connector_create.png)

Complete the form with the following information:
1. **Credential**: The previous credential;
2. **Name**: The name of the connector;
3. **# Proxies**: The number of instances to create;
4. **Zone**: The region where the instances will be created;
5. **Port**: The port of the proxy (on GCP);
6. **Machine Type**: The type of the instance;
7. **Template Name**: The name of the template to use; 
8. **Network Name**: The name of the network to use; 
9. **Label**: The default label to tag instance;
10. **Firewall Name**: The name of the firewall rule.

And click on `Create`.

::: tip
You can retain most of the default values if they are suitable for your use case.
:::


### Step 3: Install the connector

![Connector Install Select](spx_connector_install_select.png)

On the connector list, click on `Install`.

---

![Connector Install](spx_connector_install.png)

Complete the form with the following information:
1. **Disk Type**: The type of the disk;
2. **Disk Size**: The size of the disk (in GB).

And click on `Install`.

::: tip
You can retain most of the default values if they are suitable for your use case.
:::

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
