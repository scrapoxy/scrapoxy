import {defineConfig} from 'vitepress'
import {fileURLToPath, URL} from 'url'
import {readFileSync} from 'fs';
import {join} from 'path';

const
    title = 'Scrapoxy',
    description = 'The super proxies aggregator',
    iconUrl = '/assets/images/scrapoxy.svg',
    url = 'https://v4.scrapoxy.io',
    discordUrl = 'https://discord.gg/ktNGGwZnUD',
    githubUrl = 'https://github.com/fabienvauchelles/scrapoxy';

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
        ['meta', {property: 'og:image', content: `${url}/assets/images/logo200.jpg`}],
        ['meta', {property: 'og:url', content: url}],
        ['meta', {property: 'og:description', content: description}],
        ['meta', {name: 'twitter:card', content: 'summary'}],
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
            readFileSync(join(__dirname, 'fp.js')).toString(),
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
            {text: '✉️ Contact', link: `${githubUrl}/issues`},
            {
                text: '📙 Resources',
                items: [
                    {text: 'Changelog', link: '/intro/changelog'},
                    {text: 'Discord', link: discordUrl},
                    {text: 'Previous version', link: 'https://docs-v3.scrapoxy.io'},
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
                    {text: 'Digital Ocean', link: 'digitalocean/guide'},
                    {text: 'GCP', link: 'gcp/guide'},
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
                    {text: 'Rayobyte', link: 'rayobyte/guide'},
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
                            {text: 'Requests', link: 'requests/guide'},
                            {text: 'Scrapy', link: 'scrapy/guide'},
                            {text: 'Selenium', link: 'selenium/guide'},

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
                ]
            },
            {
                text: 'Contributing',
                collapsed: false,
                base: '/contrib/',
                items: [
                    {text: 'Guidelines', link: 'guidelines'},
                    {text: 'Installation', link: 'installation'},
                    {text: 'Structure', link: 'structure'},
                    {text: 'New Connector', link: 'connector'},
                    {text: 'Licence', link: 'licence'},
                ]
            },
        ],

        socialLinks: [
            {icon: 'github', link: githubUrl},
            {icon: 'discord', link: discordUrl},
        ],

        footer: {
            message: 'Released under the MIT License.',
            copyright: 'Copyright © 2016-present Fabien Vauchelles'
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
    ],

    /*
    locales: {
        root: {
            label: 'English',
            lang: 'en'
        },
        fr: {
            label: 'French',
            lang: 'fr',
            link: '/fr',

            themeConfig: {
                nav: [
                    {text: '🏠 Home', link: '/'},
                    {text: '📄 Documentation', link: '/fr/docs'},
                    {text: '✉️ Contact', link: 'https://github.com/fabienvauchelles/scrapoxy/issues'},
                    {
                        text: '📙 Resources',
                        items: [
                            {text: 'Versions', link: '/fr/releases'},
                            {text: 'Roadmap', link: '/fr/roadmap'},
                            {text: 'Discord', link: 'https://discord.com/invite/TOCHANGE'},
                            {
                                text: 'Changelog',
                                link: 'https://github.com/fabienvauchelles/scrapoxy/blob/master/CHANGELOG.md'
                            },
                        ]
                    }
                ],

                sidebar: [
                    {
                        text: 'Exemples',
                        items: [
                            {text: 'Exemples', link: '/fr/markdown-examples'},
                            {text: 'Exemples d\'API d\'exécution', link: '/fr/api-examples'}
                        ]
                    }
                ],

                footer: {
                    message: 'Publié sous la licence MIT.',
                    copyright: 'Copyright © 2016-présent Fabien Vauchelles'
                }
            },
        },
    },
     */
})
