# Amazon Web Services Connector

![AWS](/assets/images/aws.svg){width=150, nozoom}

[Amazon Web Services](https://aws.amazon.com) is a subsidiary of Amazon that provides on-demand cloud computing.


## Prerequisites

An active subscription to Amazon Web Services (AWS) is required.


## AWS Console

Connect to [AWS Console](https://console.aws.amazon.com).


### Create new credential

![AWS Credentials](aws_credentials.png)

1. On the top right, click on your name to open the menu;
2. And click on `Security credentials`.

---

![AWS Credential Create](aws_credential_create.png)

Click on `Create access key`.

---

![AWS Credential Not Recommended](aws_credential_not_recommended.png)

1. Check the box;
2. And click on `Create access key`.

---

![AWS Credential Save](aws_credential_save.png)

Remember the `Access key ID` and the `Secret access key` values.


## Scrapoxy

Open Scrapoxy User Interface and select `Marketplace`:


### Step 1: Create a new credential

![Credential Select](spx_credential_select.png)

Select `AWS` as provider to create a new credential (use search if necessary).

---

![Credential Form](spx_credential_create.png)

Complete the form by entering the following information:
1. **Name**: Specify the unique name for the credential;
2. **Access key ID**: Provide the Access Key ID associated with the account;
3. **Secret access key**: Enter the Client Secret associated with the account.

And click on `Create`.


### Step 2: Create a new connector

Create a new connector:

![Connector Create](spx_connector_create.png)

Complete the form with the following information:
1. **Credential**: The previous credential;
2. **Name**: The name of the connector;
3. **# Proxies**: The number of instances to create;
4. **Region**: The region where the instances will be created;
5. **Port**: The port of the proxy (on AWS);
6. **Instance Type**: The type of the instance;
7. **Image ID**: The name of the image in the region;
8. **Security group name**: The name of the security group containing the firewall rules;
9. **Tag**: The default tag for instance.

And click on `Create`.

::: tip
You can retain most of the default values if they are suitable for your use case.
:::


### Step 3: Install the connector

::: warning
AWS requires an image by region. So you must install the connector in each region you want to use.
:::

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
