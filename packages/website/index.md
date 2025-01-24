---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
title: 'Home'

hero:
  name: Scrapoxy
  text: Never be blocked. Again.
  tagline: Manage all your proxies in one place and <br/>smartly routes traffic to avoid bans.
  image:
    src: /assets/images/scrapoxy-warrior.png
    alt: Scrapoxy
  actions:
    - theme: brand
      text: Get Started
      link: /intro/scrapoxy
      img: https://img.shields.io/docker/v/scrapoxy/scrapoxy?logo=docker&logoColor=000000&label=docker&color=fafafa&style=social
    - theme: alt
      text: Join
      link: /l/discord-scrapoxy
      img: https://img.shields.io/discord/1095676356496461934?logo=discord&logoColor=000000&label=Discord&style=social
    - theme: alt
      text: View on Github|Add a Star
      link: /l/github-scrapoxy
      img: https://img.shields.io/github/stars/scrapoxy/scrapoxy?logo=github&logoColor=000000&label=Star&color=fafafa&style=social
      shiny: confetti
      typewritter: true

features:
  - icon: 🤫
    title: Private Proxies Pool
    details: Use your own cloud subscription to create a <b>private pool</b> of Datacenter proxies.
  - icon: 🏠
    title: All-in-One Providers
    details: Support a wide range of vendors for Residential, Mobile, and Hardware proxies.
  - icon: ✋
    title: Anti-Ban
    details: Smart traffic routing with <b>stickies sessions</b> for Headless Browsers
  - icon: 💰
    title: Cost Optimization
    details: Scale your proxy pool exclusively during scraping sessions to <b>cut costs by 80%</b>.
  - icon: 🛡️
    title: Secure
    details: All data is encrypted within your infrastructure, certify <b>zero data leakage</b>.
  - icon: 🤩
    title: Free & Open Source
    details: Completely free under the AGPLv3 License, with source code openly available on GitHub.

providers:
    - tier: ""
      size: 'medium'
      items:
        - name: 'AWS'
          url: '/l/aws'
          img: '/assets/images/aws.svg'
        - name: 'Azure'
          url: 'l/azure'
          img: '/assets/images/azure.svg'
        - name: 'Bright Data'
          url: '/l/brightdata'
          img: '/assets/images/brightdata.svg'
        - name: 'DigitalOcean'
          url: '/l/digitalocean'
          img: '/assets/images/digitalocean.svg'
        - name: 'GCP'
          url: '/l/gcp'
          img: '/assets/images/gcp.svg'
        - name: 'Geonode'
          url: '/l/geonode'
          img: '/assets/images/geonode.svg'
        - name: 'HypeProxy'
          url: '/l/hypeproxy'
          img: '/assets/images/hypeproxy.svg'
        - name: 'IPRoyal'
          url: '/l/iproyal'
          img: '/assets/images/iproyal.svg'
        - name: 'Massive'
          url: '/l/massive'
          img: '/assets/images/massive.svg'
        - name: 'NetNut'
          url: '/l/netnut'
          img: '/assets/images/netnut.svg'
        - name: 'Live Proxies'
          url: '/l/liveproxies'
          img: '/assets/images/liveproxies.svg'
        - name: 'Nimble'
          url: '/l/nimble'
          img: '/assets/images/nimbleway.svg'
        - name: 'Ninjas Proxy'
          url: '/l/ninjasproxy'
          img: '/assets/images/ninjasproxy.svg'
        - name: 'OVH'
          url: '/l/ovh'
          img: '/assets/images/ovh.svg'
        - name: 'Proxidize'
          url: '/l/proxidize'
          img: '/assets/images/proxidize.svg'
        - name: 'Proxy Cheap'
          url: '/l/proxy-cheap'
          img: '/assets/images/proxy-cheap.svg'
        - name: 'Proxy Seller'
          url: '/proxy-seller'
          img: '/assets/images/proxy-seller.svg'
        - name: 'Proxyrack'
          url: '/l/proxyrack'
          img: '/assets/images/proxyrack.svg'
        - name: 'Rayobyte'
          url: '/l/rayobyte'
          img: '/assets/images/rayobyte.svg'
        - name: 'Scaleway'
          url: '/l/scaleway'
          img: '/assets/images/scaleway.svg'
        - name: 'Smartproxy'
          url: '/l/smartproxy'
          img: '/assets/images/smartproxy.svg'
        - name: 'Zyte'
          url: '/l/zyte'
          img: '/assets/images/zyte.svg'

sponsors:
    - tier: ""
      size: 'medium'
      items:
          - name: 'BuyMeACoffee'
            url: '/l/buymeacoffee'
            img: '/assets/images/buymeacoffee.svg'

---
<HomeImage message="Your personal proxies manager:" icon="🎯" src="/assets/images/scrapoxy.gif" alt="Scrapoxy" max-width="850px"/>
<HomeGetStarted message="Get started in a few seconds:" icon="🚀" />
<HomeProviders message="Scrapoxy has connectors for:" icon="📎" :data="$frontmatter.providers" />
<HomeProviders message="Sponsor the Open Source project:" icon="❤️" :data="$frontmatter.sponsors" />

<script setup>
  import HomeImage from './components/HomeImage.vue';
  import HomeGetStarted from './components/HomeGetStarted.vue';
  import HomeProviders from './components/HomeProviders.vue';
</script>
