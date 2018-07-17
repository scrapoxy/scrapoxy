=============================
Integrate Scrapoxy to Node.js
=============================


Goal
====

Is it easy to find a good Javascript developer on Paris ? **No**!

So, it's time to build a **scraper** with `Node.js`_, Request_ and Cheerio_ to find our perfect profile.

The site `Scraping Challenge`_ indexes a lot of **profiles** (fake, for demo purposes). We want to list them.

However, the site is **protected** against scraping ! We must use Scrapoxy_ to bypass the protection.


Step 1: Create a Node.js project
================================


Install Node.js
---------------

Install the latest `Node.js`_ version.


Create a new project
--------------------

Create a directory for the project::

    mkdir nodejs-request
    cd nodejs-request


Create the package.json::

    npm init --yes


Add dependencies::

    npm install lodash bluebird cheerio request winston@2.x --save


What are these dependencies ?

* **lodash** is a javascript helper,
* **bluebird** is a promise library,
* **cheerio** is a JQuery parser,
* **requests** makes HTTP requests,
* **winston** is a logger.


Add a scraper
-------------

Add this content to :code:`index.js`

.. code-block:: js

    const _ = require('lodash'),
        Promise = require('bluebird'),
        cheerio = require('cheerio'),
        request = require('request'),
        winston = require('winston');

    winston.level = 'debug';


    const config = {
        // URL of the site
        source: 'http://scraping-challenge-2.herokuapp.com',

        opts: {
        },
    };


    // Get all URLs
    getProfilesUrls(config.source, config.opts)
        .then((urls) => {
            winston.info('Found %d profiles', urls.length);

            winston.info('Wait 120 seconds to scale instances');

            return urls;
        })

        // Wait 2 minutes to scale instances
        .delay(2 * 60 * 1000)

        .then((urls) => {

            // Get profiles one by one.
            return Promise.map(urls,
                (url) => getProfile(url, config.opts)
                    .then((profile) => {
                        winston.debug('Found %s', profile.name);

                        return profile;
                    })
                    .catch(() => {
                        winston.debug('Cannot retrieve %s', url);
                    })
                , {concurrency: 1})
                .then((profiles) => {
                    const results = _.compact(profiles);

                    winston.info('Extract %d on %d profiles', results.length, urls.length);
                });
        })
        .catch((err) => winston.error('Error: ', err));


    ////////////

    /**
     * Get all the urls of the profiles
     * @param url Main URL
     * @param defaultOpts options for http request
     * @returns {promise}
     */
    function getProfilesUrls(url, defaultOpts) {
        return new Promise((resolve, reject) => {
            // Create options for the HTTP request
            // Add the URL to the default options
            const opts = _.merge({}, defaultOpts, {url});

            request(opts, (err, res, body) => {
                if (err) {
                    return reject(err);
                }

                if (res.statusCode !== 200) {
                    return reject(body);
                }

                // Load content into a JQuery parser
                const $ = cheerio.load(body);

                // Extract all urls
                const urls = $('.profile a')
                    .map((i, el) => $(el).attr('href'))
                    .get()
                    .map((url) => `${config.source}${url}`);

                resolve(urls);
            });
        });
    }

    /**
     * Get the profile and extract the name
     * @param url URL of the profile
     * @param defaultOpts options for http request
     * @returns {promise}
     */
    function getProfile(url, defaultOpts) {
        return new Promise((resolve, reject) => {
            // Create options for the HTTP request
            // Add the URL to the default options
            const opts = _.merge({}, defaultOpts, {url});

            request(opts, (err, res, body) => {
                if (err) {
                    return reject(err);
                }

                if (res.statusCode !== 200) {
                    return reject(body);
                }

                // Load content into a JQuery parser
                const $ = cheerio.load(body);

                // Extract the names
                const name = $('.profile-info-name').text();

                resolve({name});
            });
        });
    }


Run the script
--------------

Let's try our new scraper!

Run this command::

    node index.js


The script scraps the site and list profiles.

However, `Scraping Challenge`_ is protected! All requests fail...

We will **integrate** Scrapoxy_ to bypass the protection.


Step 2: Integrate Scrapoxy to the script
========================================

Install Scrapoxy
----------------

See :doc:`../../quick_start/index` to install Scrapoxy_.


Start Scrapoxy
--------------

Set the **maximum** of instances to 6, and start Scrapoxy_ (see `Change scaling with GUI <../../standard/gui/index.html#scaling>`_).


.. WARNING::
   Don't forget to set the maximum of instances!


Edit the script
---------------

Open :code:`index.js` and modify the *config* value

.. code-block:: js

    const config = {
        // URL of the site
        source: 'http://scraping-challenge-2.herokuapp.com',

        opts: {
            // URL of Scrapoxy
            proxy: 'http://localhost:8888',

            // HTTPS over HTTP
            tunnel: false,
        }
    };


Run the script
--------------

Run this command::

    node index.js


Now, all profiles are listed!


.. _`Scraping Challenge`: http://scraping-challenge-2.herokuapp.com
.. _Scrapoxy: http://scrapoxy.io
.. _`Node.js`: https://nodejs.org
.. _Request: https://github.com/request/request
.. _Cheerio: https://github.com/cheeriojs/cheerio
