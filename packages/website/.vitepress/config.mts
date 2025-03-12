import {defineConfig} from 'vitepress'
import {fileURLToPath, URL} from 'url'

const
    title = 'Scrapoxy',
    description = 'Scrapoxy is a super proxies manager that orchestrates all your proxies into one place, rather than spreading management across multiple scrapers. Deployed on your own infrastructure, Scrapoxy serves as a single proxy endpoint for your scrapers. It builds a pool of private proxies from your datacenter subscription, integrates them with proxy vendors, manages IP rotation and fingerprinting, and smartly routes traffic to avoid bans.',
    iconUrl = '/assets/images/scrapoxy.svg',
    url = 'https://scrapoxy.io';

export default defineConfig({
    lang: 'en-US',
    title,
    description,
    lastUpdated: true,
    cleanUrls: true,

    base: '/',

    head: [
        ['link', {rel: 'icon', type: 'image/svg+xml', href: iconUrl}],
        ['meta', {property: 'og:type', content: 'website'}],
        ['meta', {property: 'og:title', content: title}],
        ['meta', {property: 'og:image', content: `${url}/assets/images/scrapoxy-embedded.png`}],
        ['meta', {property: 'og:url', content: url}],
        ['meta', {property: 'og:description', content: description}],
        ['meta', {name: 'twitter:card', content: 'summary_large_image'}],
        ['meta', {name: 'twitter:url', content: url}],
        ['meta', {name: 'twitter:site', content: '@scrapoxy_io'}],
        ['meta', {name: 'twitter:creator', content: '@fabienv'}],
        ['meta', {name: 'twitter:title', content: title}],
        ['meta', {name: 'twitter:description', content: description}],
        ['meta', {name: 'twitter:image', content: `${url}/assets/images/logo120.jpg`}],
        ['meta', {name: 'theme-color', content: '#bd5656'}],
        [
            'script',
            {async: '', src: 'https://www.googletagmanager.com/gtag/js?id=G-BWMFWJKLCC'}
        ],
        [
            'script',
            {},
            `window.dataLayer = window.dataLayer || [];
             function gtag(){dataLayer.push(arguments);}
             gtag('js', new Date());
             gtag('config', 'G-BWMFWJKLCC');`
        ],
        [
            'script',
            {},
            `window.addEventListener('click', (e) => {
               const link = e.target.closest('a');
                 if (link) {
                   const href = link.getAttribute('href');
                   if (href && href.indexOf('/l/') >= 0) {
                     e.stopImmediatePropagation();
                     window.location = href;
                     return true;
                   }
                 }
               },
               { capture: true }
             );`
        ]
    ],

    themeConfig: {
        logo: {
            light: iconUrl,
            dark: '/assets/images/scrapoxy-dark.svg'
        },

        nav: [
            {text: '🏠 Home', link: '/'},
            {text: '📄 Documentation', link: '/intro/scrapoxy'},
            {text: '✉️ Contact', link: '/l/github-scrapoxy-issues'},
            {
                text: '📙 Resources',
                items: [
                    {text: 'Changelog', link: '/intro/changelog'},
                    {text: 'Discord', link: '/l/discord-scrapoxy'},
                    {text: 'Previous version', link: '/l/scrapoxy-doc-v3'},
                ]
            }
        ],

        sidebar: [
            {
                text: 'Introduction',
                collapsed: false,
                base: '/intro/',
                items: [
                    {text: 'What is Scrapoxy?', link: 'scrapoxy'},
                    {text: 'Getting Started', link: 'get-started'},
                    {text: 'User Interface', link: 'ui'},
                    {text: 'Q&A', link: 'qna'},
                    {text: 'Changelog', link: 'changelog'},
                    {text: 'Partnerships', link: 'partnerships'},
                    {text: 'Sponsorships', link: 'sponsorships'},
                    {text: 'Licence', link: 'licence'},
                ]
            },
            {
                text: 'Usage',
                collapsed: false,
                base: '/usage/',
                items: [
                    {text: 'Command line', link: 'command-line'},
                    {text: 'Environment variables', link: 'env'},
                    {text: 'Stickies Sessions', link: 'sticky'},
                    {text: 'Errors', link: 'errors'},
                ]
            },
            {
                text: 'Deployment',
                collapsed: false,
                base: '/deployment/',
                items: [
                    {text: 'Single Instance', link: 'single-instance'},
                    {text: 'Simple Cluster', link: 'simple-cluster'},
                ]
            },
            {
                text: 'Connectors',
                collapsed: false,
                base: '/connectors/',
                items: [
                    {text: 'Proxy List', link: 'freeproxies/guide'},
                    {text: 'AWS', link: 'aws/guide'},
                    {text: 'Azure', link: 'azure/guide'},
                    {text: 'Bright Data', link: 'brightdata/guide'},
                    {text: 'Digital Ocean', link: 'digitalocean/guide'},
                    {text: 'Evomi', link: 'evomi/guide'},
                    {text: 'GCP', link: 'gcp/guide'},
                    {text: 'Geonode', link: 'geonode/guide'},
                    {text: 'HypeProxy', link: 'hypeproxy/guide'},
                    {
                        text: 'IP Royal',
                        collapsed: false,
                        base: '/connectors/iproyal/',
                        items: [
                            {text: 'Static IP', link: 'static/guide'},
                            {text: 'Dynamic IP', link: 'dynamic/guide'},
                        ]
                    },
                    {text: 'Live Proxies', link: 'liveproxies/guide'},
                    {text: 'Massive', link: 'massive/guide'},
                    {text: 'NetNut', link: 'netnut/guide'},
                    {text: 'Nimble', link: 'nimbleway/guide'},
                    {text: 'Ninjas Proxy', link: 'ninjasproxy/guide'},
                    {text: 'OVH', link: 'ovh/guide'},
                    {text: 'Proxidize', link: 'proxidize/guide'},
                    {
                        text: 'Proxy-Cheap',
                        collapsed: false,
                        base: '/connectors/proxy-cheap/',
                        items: [
                            {text: 'Static IP', link: 'static/guide'},
                            {text: 'Dynamic IP', link: 'dynamic/guide'},
                        ]
                    },
                    {text: 'Proxy Rack', link: 'proxyrack/guide'},
                    {
                        text: 'Proxy-Seller',
                        collapsed: false,
                        base: '/connectors/proxy-seller/',
                        items: [
                            {text: 'Static IP', link: 'static/guide'},
                            {text: 'Dynamic IP', link: 'dynamic/guide'},
                        ]
                    },
                    {text: 'Rayobyte', link: 'rayobyte/guide'},
                    {text: 'Scaleway', link: 'scaleway/guide'},
                    {text: 'Smartproxy', link: 'smartproxy/guide'},
                    {text: 'Tencent', link: 'tencent/guide'},
                    {text: 'XProxy', link: 'xproxy/guide'},
                    {text: 'Zyte', link: 'zyte/guide'},
                ],
            },
            {
                text: 'Integration',
                collapsed: false,
                base: '/integration/',
                items: [
                    {text: 'API Reference', link: 'api-reference'},
                    {
                        text: 'Python',
                        collapsed: false,
                        base: '/integration/python/',
                        items: [
                            {text: 'HRequests', link: 'hrequests/guide'},
                            {text: 'Kameleo', link: 'kameleo/guide'},
                            {text: 'Requests', link: 'requests/guide'},
                            {text: 'ScrapeGraphAI', link: 'scrapegraphai/guide'},
                            {text: 'Scrapy', link: 'scrapy/guide'},
                            {text: 'Selenium', link: 'selenium/guide'},
                            {text: 'Splash', link: 'splash/guide'},
                        ]
                    },
                    {
                        text: 'Javascript',
                        collapsed: false,
                        base: '/integration/js/',
                        items: [
                            {text: 'Axios', link: 'axios/guide'},
                            {text: 'Crawlee', link: 'crawlee/guide'},
                            {text: 'Playwright', link: 'playwright/guide'},
                            {text: 'Puppeteer', link: 'puppeteer/guide'},
                        ]
                    },

                ]
            },
            {
                text: 'Authentication',
                collapsed: false,
                base: '/auths/',
                items: [
                    {text: 'Standard', link: 'standard/guide'},
                    {text: 'Google', link: 'google/guide'},
                    {text: 'Github', link: 'github/guide'},
                ],
            },
            {
                text: 'Architecture',
                collapsed: false,
                base: '/architecture/',
                items: [
                    {text: 'Overview', link: 'overview'},
                    {text: 'Fingerprint', link: 'fingerprint'},
                ]
            },
            {
                text: 'Contributing',
                collapsed: false,
                base: '/contrib/',
                items: [
                    {text: 'Guidelines', link: 'guidelines'},
                    {text: 'Agreement', link: 'agreement'},
                    {text: 'Installation', link: 'installation'},
                    {text: 'Structure', link: 'structure'},
                    {text: 'New Connector', link: 'connector'},
                ]
            },
        ],

        socialLinks: [
            {icon: 'github', link: '/l/github-scrapoxy'},
            {icon: 'discord', link: '/l/discord-scrapoxy'},
        ],

        footer: {
            message: 'Released under the AGPLv3 License.',
        },

        search: {
            provider: 'algolia',
            options: {
                appId: 'BHEFK0R9M4',
                apiKey: '7d34631eaec83eb01c977a5c114cb0f4',
                indexName: 'scrapoxy'
            }
        }
    },

    vite: {
        resolve: {
            alias: [
                {
                    find: /^.*\/VPHero\.vue$/,
                    replacement: fileURLToPath(
                        new URL('./theme/components/VPHero.vue', import.meta.url)
                    )
                },
                {
                    find: /^.*\/VPNavBarMenuLink\.vue$/,
                    replacement: fileURLToPath(
                        new URL('./theme/components/VPNavBarMenuLink.vue', import.meta.url)
                    )
                },
                {
                    find: /^.*\/VPDocAsideOutline\.vue$/,
                    replacement: fileURLToPath(
                        new URL('./theme/components/VPDocAsideOutline.vue', import.meta.url)
                    )
                },
                {
                    find: /^.*\/VPSponsorsGrid\.vue$/,
                    replacement: fileURLToPath(
                        new URL('./theme/components/VPSponsorsGrid.vue', import.meta.url)
                    )
                }
            ]
        }
    },

    sitemap: {
        hostname: url,
    },

    ignoreDeadLinks: [
        // ignore all localhost links
        /^https?:\/\/localhost/,
        /\/l\//,
    ],
})
