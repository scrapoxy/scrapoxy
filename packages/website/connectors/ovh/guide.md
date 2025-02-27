# OVH Cloud Connector

![OVH](/assets/images/ovh.svg){width=280 nozoom}

[OVH Cloud](/l/ovh) is a french cloud computing service created by OVH


## Prerequisites

An active OVH subscription is required.


## OVH Manager

Connect to [Manager](/l/ovh-manager).


### Step 1: Create new project

![Ovh Project Create Select](ovh_project_create_select.png)

Click on `+ Create a new project`.

---

![OVH Project Create](ovh_project_create.png)

1. Enter `scrapoxy` as Project name;
2. And click on `Continue`.

---

![OVH Project Create 2](ovh_project_create2.png)

Click on `Create my project` and wait for project creation.

---

![OVH Project ID](ovh_project_id.png)

Remember the `Project ID`.


### Step 2: Create new credential

Connect on [https://www.ovh.com/auth/api/createToken](/l/ovh-token):

![OVH Credential_Create](ovh_credential_create.png)

Complete the form with the following information:
1. **Application name**: `Scrapoxy`
2. **Description**: `Scrapoxy`
3. **Validity**: `Unlimited`
4. **Rights**: see table below

| Method | Path                         |
|--------|------------------------------|
| GET    | /cloud/project               |
| GET    | /cloud/project/*             |
| GET    | /cloud/project/{projectId}/* |
| POST   | /cloud/project/{projectId}/* |
| DELETE | /cloud/project/{projectId}/* |

::: info
Replace `{projectId}` by the previously copied project ID.

If the `projectId` is `0123456789abcdefgh`, the path will be `/cloud/project/0123456789abcdefgh/*`.
:::

---

![OVH Credential Details](ovh_credential_details.png)

Remember:
1. Application Key;
2. Application Secret;
3. And Consumer Key.


## Scrapoxy

Open Scrapoxy User Interface and select `Marketplace`:


### Step 1: Create a new credential

![Credential Select](spx_credential_select.png)

Select `OVH` to create a new credential (use search if necessary).

---

![Credential Form](spx_credential_create.png)

Complete the form with the following information:
1. **Name**: The name of the credential;
2. **Application Key**: The key of the application;
3. **Application Secret**: The secret of the application;
4. **Consumer Key**: The consumer key of the application (this is the installation ID of the application for your account).

And click on `Create`.


### Step 2: Create a new connector

Create a new connector and select `OVH` as provider:

![Connector Create](spx_connector_create.png)

Complete the form with the following information:
1. **Credential**: The previous credential;
2. **Name**: The name of the connector;
3. **# Proxies**: The number of instances to create;
4. **Project**: The project used to create the instances;
5. **Region**: The region where the instances will be created;
6. **Port**: The port of the proxy (on OVH);
7. **Flavor**: The type of the instance;
8. **Snapshot**: The name of the snapshot to use. ⚠️ Don't fill it, it will be created automatically during installation.;
9. **Tag**: The default label to tag instance.

And click on `Create`.

Most default values can be retained if suitable for the use case.

::: warning
When setting up the connector in multiple regions, assign a unique **Tag** for each region.
Without this, connectors may interfere with each other, shutting down instances from the same provider.
:::


### Step 3: Start the connector

![Connector Start](spx_connector_start.png)

1. Start the project;
2. Start the connector.


### Step 4: Start the connector (optional)

![Connector Stop](spx_connector_stop.png)

1. Stop the connector;
2. Wait for proxies to be removed.
