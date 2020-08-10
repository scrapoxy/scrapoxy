==================
Configure Scrapoxy
==================


Create configuration
====================

To create a new configuration, use::

    scrapoxy init conf.json


Multi-Providers Example configuration
=====================================

This command creates a configuration example, with 4 providers::

  {
        "commander": {
            "password": "CHANGE_THIS_PASSWORD"
        },
        "instance": {
            "port": 3128,
            "scaling": {
                "min": 1,
                "max": 2
            }
        },
        "providers": [
            {
                "type": "awsec2",
                "accessKeyId": "YOUR ACCESS KEY ID",
                "secretAccessKey": "YOUR SECRET ACCESS KEY",
                "region": "YOUR REGION (could be: eu-west-1)",
                "instance": {
                    "InstanceType": "t1.micro",
                    "ImageId": "ami-c74d0db4",
                    "SecurityGroups": [
                        "forward-proxy"
                    ]
                }
            },
            {
                "type": "ovhcloud",
                "endpoint": "YOUR ENDPOINT (could be: ovh-eu)",
                "appKey": "YOUR APP KEY",
                "appSecret": "YOUR APP SECRET",
                "consumerKey": "YOUR CONSUMER KEY",
                "serviceId": "YOUR SERVICE ID",
                "region": "YOUR REGION (could be: BHS1, GRA1 or SBG1)",
                "sshKeyName": "YOUR SSH KEY (could be: mykey)",
                "flavorName": "vps-ssd-1",
                "snapshotName": "YOUR SNAPSHOT NAME (could be: forward-proxy)"
            },
            {
                "type": "digitalocean",
                "token": "YOUR PERSONAL TOKEN",
                "region": "YOUR REGION (could be: lon1)",
                "size": "s-1vcpu-1gb (previous: 512mb)",
                "sshKeyName": "YOUR SSH KEY (could be: mykey)",
                "imageName": "YOUR SNAPSHOT NAME (could be: forward-proxy)",
                "tags": "YOUR TAGS SEPARATED BY A COMMA (could be: proxy,instance)"
            },
            {
                "type": "vscale",
                "token": "YOUR PERSONAL TOKEN",
                "region": "YOUR REGION (could be: msk0, spb0)",
                "imageName": "YOUR SNAPSHOT NAME (could be: forward-proxy)",
                "sshKeyName": "YOUR SSH KEY (could be: mykey)",
                "plan": "YOUR PLAN (could be: small)"
            }
        ]
  }


Options: commander
==================

======== ============= ===================================
Option   Default value Description
======== ============= ===================================
port     8889          TCP port of the REST API
password none          Password to access to the commander
======== ============= ===================================


Options: instance
=================

================== ============= =============================================================================
Option             Default value Description
================== ============= =============================================================================
port               none          TCP port of your instance (example: 3128)
username           none          Credentials if your proxy instance needs them (optional)
password           none          Credentials if your proxy instance needs them (optional)
scaling            none          see :ref:`instance / scaling <instance-scaling>`
checkDelay         10000         (in ms) Scrapoxy requests the status of instances to the provider, every X ms
checkAliveDelay    20000         (in ms) Scrapoxy pings instances every X ms
stopIfCrashedDelay 120000        (in ms) Scrapoxy restarts an instance if it has been dead for X ms
autorestart        none          see :ref:`instance / autorestart <instance-autorestart>`
================== ============= =============================================================================


.. _instance-autorestart:

Options: instance / autorestart
===============================

Scrapoxy randomly restarts instance to change the IP address.

The delay is between minDelay and maxDelay.

======== ============= =====================
Option   Default value Description
======== ============= =====================
minDelay 3600000       (in ms) Minimum delay
maxDelay 43200000      (in ms) Maximum delay
======== ============= =====================


.. _instance-scaling:

Options: instance / scaling
===========================

============== ============= ===========================================================================
Option         Default value Description
============== ============= ===========================================================================
min            none          The desired count of instances when Scrapoxy is asleep
max            none          The desired count of instances when Scrapoxy is awake
required       none          The count of actual instances
downscaleDelay 600000        (in ms) Time to wait to remove unused instances when Scrapoxy is not in use
============== ============= ===========================================================================


Options: logs
=============

====== ============= =============================================
Option Default value Description
====== ============= =============================================
path   none          If specified, writes all logs in a dated file
====== ============= =============================================


Options: providers
==================

Providers is an array of provider. It can contains multiple providers:

* AWS EC2: see `AWS EC2 - Configuration <../providers/awsec2/index.html#configure-scrapoxy-awsec2>`_
* OVH Cloud: see `OVH Cloud - Configuration <../providers/ovhcloud/index.html#configure-scrapoxy-ovhcloud>`_
* DigitalOcean: see `DigitalOcean - Configuration <../providers/digitalocean/index.html#configure-scrapoxy-digitalocean>`_
* Vscale: see `Vscale - Configuration <../providers/vscale/index.html#configure-scrapoxy-vscale>`_


Options: proxy
==============

================== ============= ===============================================================================
Option             Default value Description
================== ============= ===============================================================================
port               8888          TCP port of Scrapoxy
auth               none          see :ref:`proxy / auth <proxy-auth>` (optional)
domains_allowed    []            allowlisted domains: only URLs with this domains are allowed (ignored if empty)
domains_forbidden  []            blocklisted domains: URLs with this domains are rejected (ignored if empty)
mitm               False         see :ref:`man in the middle <mitm>` (optional)
================== ============= ===============================================================================


.. _proxy-auth:

Options: proxy / auth
=====================

======== ============= =======================================
Option   Default value Description
======== ============= =======================================
username none          Credentials if your Scrapoxy needs them
password none          Credentials if your Scrapoxy needs them
======== ============= =======================================


.. _mitm:

Options: proxy / mitm
=====================

============= ============= ======================================================================
Option        Default value Description
============= ============= ======================================================================
cert_filename none          Public key filename for MITM certificate (scrapoxy has a default one)
key_filename  none          Private key filename for MITM certificate (scrapoxy has a default one)
============= ============= ======================================================================


Options: stats
==============

============= ============= ========================================
Option        Default value Description
============= ============= ========================================
retention     86400000      (in ms) Duration of statistics retention
samplingDelay 1000          (in ms) Get stats every X ms
============= ============= ========================================
