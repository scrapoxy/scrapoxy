==========================
Manage Scrapoxy with a GUI
==========================


Connect
=======

You can access to the GUI at http://localhost:8889/


Login
=====

.. image:: gui_login.png

Enter your password.

The password is defined in the configuration file, key **commander.password**.


Dashboard
=========

.. image:: gui_general.jpg

Scrapoxy GUI has many pages:

- **Instances**. This page contains the list of instances managed by Scrapoxy;
- **Stats**. This page contains statistics on the use of Scrapoxy.

To login page redirects to the Instances page.


Page: Instances
===============

Scaling
-------

.. image:: gui_scaling.jpg
   :width: 240px

This panel shows the number of instances.

Scrapoxy has 3 settings:

- **Min**. The desired count of instances when Scrapoxy is asleep;
- **Max**. The desired count of instances when Scrapoxy is awake;
- **Required**. The count of actual instances.

To add or remove an instance, click on the **Scaling** button and change the **Required** setting:

.. image:: gui_scaling_change.jpg


Status of an instance
---------------------

.. image:: gui_instance.png
   :width: 120px

Each instance is described in a panel.

This panel contains many information:

- Name of the instance;
- IP of the instance;
- Provider type;
- Instance status on the provider;
- Instance status in Scrapoxy.

Scrapoxy relays requests to instances which are **started** and **alived**
(|started| + |alive|).


Type of provider
~~~~~~~~~~~~~~~~

+----------------+--------------+
| |awsec2|       | AWS / EC2    |
+----------------+--------------+
| |ovhcloud|     | OVH Cloud    |
+----------------+--------------+
| |digitalocean| | DigitalOcean |
+----------------+--------------+
| |vscale|       | VScale       |
+----------------+--------------+

.. |awsec2| image:: gui_instance_awsec2.png
   :width: 25px

.. |digitalocean| image:: gui_instance_digitalocean.png
   :width: 25px

.. |ovhcloud| image:: gui_instance_ovhcloud.png
   :width: 25px

.. |vscale| image:: gui_instance_vscale.png
   :width: 25px


Status in the provider
~~~~~~~~~~~~~~~~~~~~~~

+------------+----------+
| |starting| | Starting |
+------------+----------+
| |started|  | Started  |
+------------+----------+
| |stopping| | Stopping |
+------------+----------+
| |stopped|  | Stopped  |
+------------+----------+

.. |starting| image:: gui_instance_starting.png
   :width: 25px

.. |started| image:: gui_instance_started.png
   :width: 25px

.. |stopping| image:: gui_instance_stopping.png
   :width: 25px

.. |stopped| image:: gui_instance_stopped.png
   :width: 25px


Status in Scrapoxy
~~~~~~~~~~~~~~~~~~

+---------+-------+
| |alive| | Alive |
+---------+-------+
| |dead|  | Dead  |
+---------+-------+

.. |alive| image:: gui_instance_alive.png
   :width: 25px

.. |dead| image:: gui_instance_dead.png
   :width: 25px


Remove an instance
------------------

.. image:: gui_instance_del.png
   :width: 120px

Click on the instance to delete it.

The instance stops and is replaced by another.


Page: Stats
===========

There are 3 panels in stats:

- **Global stats**. This panel contains global stats;
- **Requests**. This panel contains the count of requests;
- **Flow**. This panel contains the flow requests.


Global
------

.. image:: gui_stats_global.jpg

This panel has 4 indicators:

- the total **count of requests** to monitor performance;
- the total **count of received and sent data** to control the volume of data;
- the total of **stop instance orders**, to monitor anti-blocklisting;
- the **count of requests received by an instance** (minimum, average, maximum) to check anti-blocklisting performance.


Requests
--------

.. image:: gui_stats_requests.jpg

This panel combines 2 statistics on 1 chart.

It measures:

- the **count of requests** per minute;
- the **average execution time** of a request (round trip), per minute.


Flow
----

.. image:: gui_stats_flow.jpg

This panel combines 2 statistics on 1 chart.

It measures:

- the flow **received** by Scrapoxy;
- the flow **sent** by Scrapoxy.


How to increase the number of requests per minute ?
---------------------------------------------------

You add new instances (or new scrapers).

Do you increase the number of requests par minute ?

- **Yes**: Perfect!
- **No**: You pay instances for nothing.


Do I overload the target website ?
----------------------------------

You add new instances (or new scrapers).

Did the time of response increase ?

- **Yes**: The target website is overloaded.
- **No**: Perfect!
